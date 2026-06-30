import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  getChainProviders,
  Parents,
  TApiOrUrl,
  Version,
  getRelayChainOf,
  TSubstrateChain,
  PARACHAINS,
  TBuilderOptions,
  TTransferBaseOptionsWithSender,
  getChain,
  isRelayChain,
  TTransferInternalOptions,
  RELAYCHAINS,
  isSystemChain,
  RuntimeApiUnavailableError,
  TBuilderConfig,
  TUrl,
  parseUnits
} from '../src'
import { GeneralBuilder } from '../dist'
import { doesNotSupportParaToRelay, generateTransferScenarios } from './utils'
import { generateAssetsTests } from '../../assets/e2e'
import {
  findAssetInfo,
  ForeignAbstract,
  getAssets,
  getRelayChainSymbol,
  hasSupportForAsset,
  isChainEvm,
  Native
} from '@paraspell/assets'

beforeEach(ctx => {
  console.log(`▶ Running test: ${ctx.task.name}`)
})

afterEach(ctx => {
  console.log(`✅ Finished test: ${ctx.task.name}`)
})

const MOCK_AMOUNT = 5
const MOCK_ADDRESS = '1phKfRLnZm8iWTq5ki2xAPf5uwxjBrEe6Bc3Tw2bxPLx3t8'
const MOCK_ETH_ADDRESS = '0x1501C1413e4178c38567Ada8945A80351F7B8496'

export const generateE2eTests = <TApi, TRes, TSigner>(
  Builder: <TOpts extends TBuilderOptions<TApiOrUrl<TApi>>>(
    options?: TOpts
  ) => GeneralBuilder<TApi, TRes, TSigner>,
  [signer, evmSigner]: [TSigner, TSigner],
  validateTx: (tx: TRes, signer: TSigner) => Promise<void>,
  filteredChains: TSubstrateChain[],
  config?: TBuilderConfig<TUrl>
) => {
  const validateTransfer = async (
    builder: GeneralBuilder<
      TApi,
      TRes,
      TSigner,
      TTransferBaseOptionsWithSender<TApi, TRes, TSigner>
    >,
    signer: TSigner
  ) => {
    const tx = await builder.build()
    await validateTx(tx, signer)
    const feeRes = await builder.getXcmFee()
    expect(feeRes.failureReason).toBeUndefined()
  }
  // If builderConfig override is provided, it means we're using chopsticks
  const usingChopsticks = !!config

  const describeGroup = (name: string, fn: () => void) =>
    describe(name, { concurrent: usingChopsticks }, fn)

  describeGroup('XCM - e2e', () => {
    describeGroup('Polkadot Kusama bridge', () => {
      it('should create bridge transfer tx AssetHubPolkadot -> AssetHubKusama (KSM)', async () => {
        const builder = Builder(config)
          .from('AssetHubPolkadot')
          .to('AssetHubKusama')
          .currency({
            location: {
              parents: 2,
              interior: { X1: [{ GlobalConsensus: { kusama: null } }] }
            },
            amount: MOCK_AMOUNT
          })
          .sender(MOCK_ADDRESS)
          .recipient(MOCK_ADDRESS)
        await validateTransfer(builder, signer)
      })

      it('should create bridge transfer tx AssetHubKusama -> AssetHubPolkadot (DOT)', async () => {
        const builder = Builder(config)
          .from('AssetHubKusama')
          .to('AssetHubPolkadot')
          .currency({
            location: {
              parents: 2,
              interior: { X1: [{ GlobalConsensus: { polkadot: null } }] }
            },
            amount: MOCK_AMOUNT
          })
          .sender(MOCK_ADDRESS)
          .recipient(MOCK_ADDRESS)
        await validateTransfer(builder, signer)
      })

      it('should create bridge transfer tx AssetHubKusama -> AssetHubPolkadot (KSM)', async () => {
        const builder = Builder(config)
          .from('AssetHubKusama')
          .to('AssetHubPolkadot')
          .currency({
            location: {
              parents: 1,
              interior: { Here: null }
            },
            amount: MOCK_AMOUNT
          })
          .sender(MOCK_ADDRESS)
          .recipient(MOCK_ADDRESS)
        await validateTransfer(builder, signer)
      })
    })

    describeGroup('AssetClaim', () => {
      const ASSET_CLAIM_CHAINS: TSubstrateChain[] = [
        'Polkadot',
        'Kusama',
        'AssetHubPolkadot',
        'AssetHubKusama'
      ]
      ASSET_CLAIM_CHAINS.forEach(chain => {
        it(`should create asset claim tx for ${chain}`, async () => {
          const tx = await Builder(config)
            .claimFrom(chain)
            .currency([
              {
                id: {
                  parents: Parents.ZERO,
                  interior: 'Here'
                },
                fun: { Fungible: MOCK_AMOUNT }
              }
            ])
            .address(MOCK_ADDRESS)
            .build()
          await validateTx(tx, signer)
        })
      })

      it('should create asset claim tx V3', async () => {
        const tx = await Builder(config)
          .claimFrom('AssetHubPolkadot')
          .currency([
            {
              location: { parents: Parents.ONE, interior: { Here: null } },
              amount: MOCK_AMOUNT
            }
          ])
          .address(MOCK_ADDRESS)
          .xcmVersion(Version.V3)
          .build()
        await validateTx(tx, signer)
      })
    })

    describeGroup('RelayToPara', () => {
      RELAYCHAINS.forEach(relayChain => {
        PARACHAINS.forEach(chain => {
          const symbol = getRelayChainSymbol(chain)
          if (!hasSupportForAsset(chain, symbol)) return
          it(`should create transfer tx - ${symbol} from ${relayChain} to ${chain}`, async () => {
            try {
              const builder = Builder(config)
                .from(relayChain)
                .to(chain)
                .currency({ symbol, amount: MOCK_AMOUNT })
                .sender(MOCK_ADDRESS)
                .recipient(MOCK_ADDRESS)
              await validateTransfer(builder, signer)
            } catch (error) {
              if (error instanceof RuntimeApiUnavailableError) {
                expect(error.name).toBe(RuntimeApiUnavailableError)
              }
            }
          })
        })
      })
    })

    describeGroup('Hydration to AssetHub transfer - miscellaneous scenarios', () => {
      it('should create transfer tx from Hydration to AssetHubPolkadot', async () => {
        const builder = Builder(config)
          .from('Hydration')
          .to('AssetHubPolkadot')
          .currency({ symbol: ForeignAbstract('USDT1'), amount: MOCK_AMOUNT })
          .sender(MOCK_ADDRESS)
          .recipient(MOCK_ADDRESS)
        expect(builder).toBeDefined()
      })

      it('should create transfer tx with multiple assets from Hydration to AssetHubPolkadot - assets selected by symbol with fee asset', async () => {
        const tx = await Builder(config)
          .from('Hydration')
          .to('AssetHubPolkadot')
          .currency([
            {
              symbol: ForeignAbstract('USDT1'),
              amount: '102928'
            },
            {
              symbol: ForeignAbstract('USDC3'),
              amount: '38482'
            }
          ])
          .feeAsset({ symbol: ForeignAbstract('USDC3') })
          .sender(MOCK_ADDRESS)
          .recipient(MOCK_ADDRESS)
          .build()
        validateTx(tx, signer)
      })

      it('should create transfer tx with multiple assets from Hydration to AssetHubPolkadot - assets registered via customAssets with fee asset', async () => {
        const customAssets = [
          {
            symbol: 'CUSTA',
            decimals: 6,
            assetId: '80001',
            location: {
              parents: 1,
              interior: {
                X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 80001 }]
              }
            }
          },
          {
            symbol: 'CUSTB',
            decimals: 6,
            assetId: '80002',
            location: {
              parents: 1,
              interior: {
                X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 80002 }]
              }
            }
          }
        ]
        const tx = await Builder({ ...config, customAssets: { Hydration: customAssets } })
          .from('Hydration')
          .to('AssetHubPolkadot')
          .currency([
            { symbol: 'CUSTA', amount: '102928' },
            { symbol: 'CUSTB', amount: '38482' }
          ])
          .feeAsset({ symbol: 'CUSTB' })
          .sender(MOCK_ADDRESS)
          .recipient(MOCK_ADDRESS)
          .build()
        validateTx(tx, signer)
      })
    })

    // Auto API creation testing makes sense only in non-chopsticks environment
    if (!usingChopsticks) {
      describeGroup('Auto API create', () => {
        it('should create transfer tx from Acala to Astar - auto API', async () => {
          const builder = Builder()
            .from('Acala')
            .to('Astar')
            .currency({ symbol: 'DOT', amount: parseUnits('1', 10) })
            .sender(MOCK_ADDRESS)
            .recipient(MOCK_ADDRESS)
          await validateTransfer(builder, signer)
        })

        it('should create transfer tx from Acala to Astar - WS url', async () => {
          const acalaProvider = getChainProviders('Acala')[0]
          const builder = Builder(acalaProvider)
            .from('Acala')
            .to('Astar')
            .currency({ symbol: 'DOT', amount: parseUnits('1', 10) })
            .sender(MOCK_ADDRESS)
            .recipient(MOCK_ADDRESS)
          await validateTransfer(builder, signer)
        })

        it('should create transfer tx from Acala to Astar - WS url array', async () => {
          const acalaProviders = getChainProviders('Acala').slice(0, 2)
          const builder = Builder(acalaProviders)
            .from('Acala')
            .to('Astar')
            .currency({ symbol: 'DOT', amount: parseUnits('1', 10) })
            .sender(MOCK_ADDRESS)
            .recipient(MOCK_ADDRESS)
          await validateTransfer(builder, signer)
        })
      })
    }

    filteredChains.forEach(chain => {
      const scenarios = generateTransferScenarios(chain, usingChopsticks)

      const relayChainSymbol = getRelayChainSymbol(chain)

      const relayChainAsset = findAssetInfo(
        chain,
        // Use native selector for system chains
        { symbol: isSystemChain(chain) ? Native(relayChainSymbol) : relayChainSymbol },
        getRelayChainOf(chain)
      )
      const paraToRelaySupported = relayChainAsset && !doesNotSupportParaToRelay.includes(chain)
      if (scenarios.length === 0 && !paraToRelaySupported) {
        return
      }

      // Skip temporarily disabled chains
      const chainInstance = !isRelayChain(chain) ? getChain(chain) : null
      const isSendingDisabled = chainInstance?.isSendingTempDisabled(
        {} as TTransferInternalOptions<unknown, unknown, unknown>
      )
      if (isSendingDisabled) return

      describeGroup(`Transfer scenarios for origin ${chain}`, () => {
        describeGroup('ParaToPara', () => {
          scenarios.forEach(({ destChain, asset }) => {
            it(`should create transfer tx from ${chain} to ${destChain} - (${asset.symbol})`, async () => {
              const sender = isChainEvm(chain) ? MOCK_ETH_ADDRESS : MOCK_ADDRESS
              const recipient = isChainEvm(destChain) ? MOCK_ETH_ADDRESS : MOCK_ADDRESS
              try {
                const builder = Builder(config)
                  .from(chain)
                  .to(destChain)
                  .currency({
                    location: asset.location,
                    amount: MOCK_AMOUNT
                  })
                  .recipient(recipient)
                  .sender(sender)
                  .ahAddress(MOCK_ADDRESS)

                await validateTransfer(builder, isChainEvm(chain) ? evmSigner : signer)
              } catch (error) {
                if (error instanceof Error) {
                  const allowedErrorNames = [
                    'ScenarioNotSupportedError',
                    'NoXCMSupportImplementedError',
                    'RoutingResolutionError',
                    'RuntimeApiUnavailableError',
                    'TypeAndThenUnavailableError'
                  ]

                  if (allowedErrorNames.includes(error.name)) {
                    expect(error.name).toBeDefined()
                  } else if (error.message.includes('LocalExecutionIncomplete')) {
                    expect(error.message).toContain('LocalExecutionIncomplete')
                  } else if (
                    error.name === 'FeatureTemporarilyDisabledError' ||
                    error.message.includes('temporarily disabled')
                  ) {
                    expect(error.name).toBe('FeatureTemporarilyDisabledError')
                  } else {
                    throw error
                  }
                }
              }
            })
          })
        })

        if (relayChainAsset && !doesNotSupportParaToRelay.includes(chain)) {
          it(`should create transfer tx - ParaToRelay ${getRelayChainSymbol(
            chain
          )} from ${chain} to Relay`, async () => {
            const relaySymbol = getRelayChainSymbol(chain)
            const symbol = isSystemChain(chain) ? Native(relaySymbol) : relaySymbol
            const relayChain = getRelayChainOf(chain)
            const sender = isChainEvm(chain) ? MOCK_ETH_ADDRESS : MOCK_ADDRESS
            try {
              const builder = Builder(config)
                .from(chain)
                .to(relayChain)
                .currency({ symbol, amount: MOCK_AMOUNT })
                .sender(sender)
                .recipient(MOCK_ADDRESS)
                .ahAddress(MOCK_ADDRESS)
              await validateTransfer(builder, isChainEvm(chain) ? evmSigner : signer)
            } catch (error) {
              if (error instanceof Error) {
                const allowedErrorNames = ['TypeAndThenUnavailableError']
                if (allowedErrorNames.includes(error.name)) {
                  expect(error.name).toBeDefined()
                } else if (
                  error.name === 'FeatureTemporarilyDisabledError' ||
                  error.message.includes('temporarily disabled')
                ) {
                  expect(error.name).toBe('FeatureTemporarilyDisabledError')
                } else {
                  throw error
                }
              }
            }
          })
        }
      })

      describeGroup('Local transfer', () => {
        getAssets(chain).forEach(asset => {
          it(`should create local transfer tx on ${chain} - (${asset.symbol})`, async () => {
            const address = isChainEvm(chain) ? MOCK_ETH_ADDRESS : MOCK_ADDRESS

            try {
              const builder = Builder(config)
                .from(chain)
                .to(chain)
                .currency({ location: asset.location, amount: MOCK_AMOUNT })
                .sender(address)
                .recipient(address)
              await validateTransfer(builder, isChainEvm(chain) ? evmSigner : signer)
            } catch (error) {
              if (error instanceof RuntimeApiUnavailableError) {
                expect(error).toBeInstanceOf(RuntimeApiUnavailableError)
              }
            }
          })
        })
      })
    })
  })

  generateAssetsTests()
}
