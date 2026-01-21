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
  TSendBaseOptionsWithSenderAddress,
  getChain,
  isRelayChain,
  TSendInternalOptions,
  RELAYCHAINS,
  isSystemChain,
  hasJunction,
  assertHasLocation,
  RuntimeApiUnavailableError,
  TBuilderConfig,
  TUrl
} from '../src'
import { GeneralBuilder } from '../dist'
import { doesNotSupportParaToRelay, generateTransferScenarios } from './utils'
import { generateAssetsTests } from '../../assets/e2e'
import {
  findAssetInfo,
  ForeignAbstract,
  getAssets,
  getOtherAssets,
  getRelayChainSymbol,
  hasSupportForAsset,
  isChainEvm,
  Native,
  TAssetInfo,
  TCurrencyCore
} from '@paraspell/assets'

beforeEach(ctx => {
  console.log(`▶ Running test: ${ctx.task.name}`)
})

afterEach(ctx => {
  console.log(`✅ Finished test: ${ctx.task.name}`)
})

const MOCK_AMOUNT = 1
const MOCK_ADDRESS = '1phKfRLnZm8iWTq5ki2xAPf5uwxjBrEe6Bc3Tw2bxPLx3t8'
const MOCK_ETH_ADDRESS = '0x1501C1413e4178c38567Ada8945A80351F7B8496'

export const generateE2eTests = <TApi, TRes, TSigner>(
  Builder: (api?: TBuilderOptions<TApiOrUrl<TApi>>) => GeneralBuilder<TApi, TRes>,
  [signer, evmSigner]: [TSigner, TSigner],
  validateTx: (tx: TRes, signer: TSigner) => Promise<void>,
  validateTransfer: (
    builder: GeneralBuilder<TApi, TRes, TSendBaseOptionsWithSenderAddress<TRes>>,
    signer: TSigner
  ) => Promise<void>,
  filteredChains: TSubstrateChain[],
  builderConfig?: TBuilderConfig<TUrl>
) => {
  const config: TBuilderConfig<TUrl> = {
    ...builderConfig,
    abstractDecimals: true
  }

  // If builderConfig override is provided, it means we're using chopsticks
  const usingChopsticks = !!builderConfig

  const describeGroup = usingChopsticks ? describe.concurrent : describe.sequential

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
          .senderAddress(MOCK_ADDRESS)
          .address(MOCK_ADDRESS)
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
          .senderAddress(MOCK_ADDRESS)
          .address(MOCK_ADDRESS)
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
          .senderAddress(MOCK_ADDRESS)
          .address(MOCK_ADDRESS)
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

    describeGroup('Ethereum transfers', async () => {
      const ethAssets = getOtherAssets('AssetHubPolkadot').filter(
        asset =>
          asset.location &&
          hasJunction(asset.location, 'GlobalConsensus', {
            Ethereum: { chainId: 1 }
          })
      )
      ethAssets.forEach(asset => {
        if (!asset.location) return
        it(`should create transfer tx - ${asset.symbol} from AssetHubPolkadot to Ethereum`, async () => {
          assertHasLocation(asset)
          const builder = Builder(config)
            .from('AssetHubPolkadot')
            .to('Ethereum')
            .currency({ location: asset.location, amount: MOCK_AMOUNT })
            .address(MOCK_ETH_ADDRESS)
            .senderAddress(MOCK_ADDRESS)
          await validateTransfer(builder, signer)
        })
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
                .senderAddress(MOCK_ADDRESS)
                .address(MOCK_ADDRESS)
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
          .senderAddress(MOCK_ADDRESS)
          .address(MOCK_ADDRESS)
        expect(builder).toBeDefined()
      })

      it('should create transfer tx from Hydration to AssetHubPolkadot - overridden asset', async () => {
        const tx = await Builder(config)
          .from('Hydration')
          .to('AssetHubPolkadot')
          .currency([
            {
              symbol: 'USDT',
              amount: '102928'
            },
            {
              symbol: 'USDC',
              amount: '38482'
            }
          ])
          .feeAsset({ symbol: 'USDC' })
          .senderAddress(MOCK_ADDRESS)
          .address(MOCK_ADDRESS)
          .build()
        validateTx(tx, signer)
      })

      it('should create transfer tx from Hydration to AssetHubPolkadot - overridden multiasset currency selection', async () => {
        const tx = await Builder(config)
          .from('Hydration')
          .to('AssetHubPolkadot')
          .currency([
            {
              id: {
                parents: 0,
                interior: { X2: [{ PalletInstance: '50' }, { GeneralIndex: '31337' }] }
              },
              fun: { Fungible: '102928' }
            },
            {
              id: {
                parents: 0,
                interior: { X2: [{ PalletInstance: '50' }, { GeneralIndex: '1337' }] }
              },
              fun: { Fungible: '38482' }
            }
          ])
          .feeAsset({
            location: {
              parents: 0,
              interior: { X2: [{ PalletInstance: '50' }, { GeneralIndex: '1337' }] }
            }
          })
          .senderAddress(MOCK_ADDRESS)
          .address(MOCK_ADDRESS)
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
            .currency({ symbol: 'DOT', amount: MOCK_AMOUNT })
            .senderAddress(MOCK_ADDRESS)
            .address(MOCK_ADDRESS)
          await validateTransfer(builder, signer)
        })

        it('should create transfer tx from Acala to Astar - WS url', async () => {
          const acalaProvider = getChainProviders('Acala')[0]
          const builder = Builder(acalaProvider)
            .from('Acala')
            .to('Astar')
            .currency({ symbol: 'DOT', amount: MOCK_AMOUNT })
            .senderAddress(MOCK_ADDRESS)
            .address(MOCK_ADDRESS)
          await validateTransfer(builder, signer)
        })

        it('should create transfer tx from Acala to Astar - WS url array', async () => {
          const acalaProviders = getChainProviders('Acala').slice(0, 2)
          const builder = Builder(acalaProviders)
            .from('Acala')
            .to('Astar')
            .currency({ symbol: 'DOT', amount: MOCK_AMOUNT })
            .senderAddress(MOCK_ADDRESS)
            .address(MOCK_ADDRESS)
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
        {} as TSendInternalOptions<TApi, TRes>
      )
      if (isSendingDisabled) return

      const getCurrency = (asset: TAssetInfo): TCurrencyCore => {
        if (asset.location) {
          return { location: asset.location }
        }

        // Bifrost has duplicated asset ids, thus use symbol specifier
        if (!asset.isNative && asset.assetId && !chain.startsWith('Bifrost')) {
          return { id: asset.assetId }
        }

        return { symbol: asset.symbol }
      }

      describeGroup(`Transfer scenarios for origin ${chain}`, () => {
        describeGroup('ParaToPara', () => {
          scenarios.forEach(({ destChain, asset }) => {
            it(`should create transfer tx from ${chain} to ${destChain} - (${asset.symbol})`, async () => {
              const currency = getCurrency(asset)
              const senderAddress = isChainEvm(chain) ? MOCK_ETH_ADDRESS : MOCK_ADDRESS
              const address = isChainEvm(destChain) ? MOCK_ETH_ADDRESS : MOCK_ADDRESS
              try {
                const builder = Builder(config)
                  .from(chain)
                  .to(destChain)
                  .currency({
                    ...currency,
                    amount: MOCK_AMOUNT
                  })
                  .address(address)
                  .senderAddress(senderAddress)

                await validateTransfer(builder, isChainEvm(chain) ? evmSigner : signer)
              } catch (error) {
                if (error instanceof Error) {
                  const allowedErrorNames = [
                    'ScenarioNotSupportedError',
                    'NoXCMSupportImplementedError',
                    'TransferToAhNotSupported',
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
            const senderAddress = isChainEvm(chain) ? MOCK_ETH_ADDRESS : MOCK_ADDRESS
            try {
              const builder = Builder(config)
                .from(chain)
                .to(relayChain)
                .currency({ symbol, amount: MOCK_AMOUNT })
                .senderAddress(senderAddress)
                .address(MOCK_ADDRESS)
              await validateTransfer(builder, isChainEvm(chain) ? evmSigner : signer)
            } catch (error) {
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
          })
        }
      })

      describeGroup('Local transfer', () => {
        getAssets(chain).forEach(asset => {
          it(`should create local transfer tx on ${chain} - (${asset.symbol})`, async () => {
            const currency = getCurrency(asset)
            const address = isChainEvm(chain) ? MOCK_ETH_ADDRESS : MOCK_ADDRESS

            try {
              const builder = Builder(config)
                .from(chain)
                .to(chain)
                .currency({ ...currency, amount: MOCK_AMOUNT })
                .senderAddress(address)
                .address(address)
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
