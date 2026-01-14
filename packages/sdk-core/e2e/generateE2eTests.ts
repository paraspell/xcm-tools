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
  RuntimeApiUnavailableError
} from '../src'
import { GeneralBuilder } from '../dist'
import { doesNotSupportParaToRelay, generateTransferScenarios } from './utils'
import { generateAssetsTests } from '../../assets/e2e'
import {
  findAssetInfo,
  ForeignAbstract,
  getOtherAssets,
  getRelayChainSymbol,
  hasSupportForAsset,
  isChainEvm,
  Native,
  TCurrencyCore
} from '@paraspell/assets'

beforeEach(ctx => {
  console.log(`▶ Running test: ${ctx.task.name}`)
})

afterEach(ctx => {
  console.log(`✅ Finished test: ${ctx.task.name}`)
})

const MOCK_AMOUNT = 1000000000000
const MOCK_ADDRESS = '1phKfRLnZm8iWTq5ki2xAPf5uwxjBrEe6Bc3Tw2bxPLx3t8'
const MOCK_ETH_ADDRESS = '0x1501C1413e4178c38567Ada8945A80351F7B8496'

export const generateE2eTests = <TApi, TRes, TSigner>(
  Builder: (api?: TBuilderOptions<TApiOrUrl<TApi>>) => GeneralBuilder<TApi, TRes>,
  createChainClient: (chain: TSubstrateChain) => Promise<TApi>,
  signer: TSigner,
  evmSigner: TSigner,
  validateTx: (tx: TRes, signer: TSigner) => Promise<void>,
  validateTransfer: (
    builder: GeneralBuilder<TApi, TRes, TSendBaseOptionsWithSenderAddress>,
    signer: TSigner
  ) => Promise<void>,
  filteredChains: TSubstrateChain[],
  isPjs: boolean,
  createRequiredChopsticksChains?: (chains: TSubstrateChain[]) => Promise<Record<TSubstrateChain, string>>,
  useChopsticks: boolean = false
) => {
  describe.sequential('XCM - e2e', () => {
    const apiPool: Record<string, TApi> = {}

    const createOrGetApiInstanceForChain = async (chain: TSubstrateChain) => {
      if (!isPjs) {
        return getChainProviders(chain)
      }

      if (!apiPool[chain]) {
        const api = await createChainClient(chain)
        apiPool[chain] = api
      }
      return apiPool[chain]
    }

    const createBuilder = async (chain: TSubstrateChain, chains: TSubstrateChain[]) => {
      if (useChopsticks) {
        if (!createRequiredChopsticksChains) {
          throw new Error('createRequiredChopsticksChains is required when using Chopsticks')
        }

        const chainMap = await createRequiredChopsticksChains(chains)
        return Builder({ apiOverrides: Object.fromEntries(Object.entries(chainMap).map(([chain, url]) => [chain, [url]])) })
      }
      const api = await createOrGetApiInstanceForChain(chain)
      return Builder(api)
    }

    describe.sequential('Polkadot Kusama bridge', () => {
      const chains = ['AssetHubPolkadot', 'AssetHubKusama', 'Polkadot', 'Kusama'] as TSubstrateChain[]

      it('should create bridge transfer tx AssetHubPolkadot -> AssetHubKusama (KSM)', async () => {
        const builder = (await createBuilder('AssetHubPolkadot', chains))
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
        const builder = (await createBuilder('AssetHubKusama', chains))
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
        const builder = (await createBuilder('AssetHubKusama', chains))
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

    describe.sequential('AssetClaim', () => {
      const ASSET_CLAIM_CHAINS: TSubstrateChain[] = [
        'Polkadot',
        'Kusama',
        'AssetHubPolkadot',
        'AssetHubKusama'
      ]
      ASSET_CLAIM_CHAINS.forEach(chain => {
        it(`should create asset claim tx for ${chain}`, async () => {
          const tx = await (await createBuilder(chain, [chain]))
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
        const tx = await (await createBuilder('AssetHubPolkadot', ['AssetHubPolkadot']))
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

    describe.sequential('Ethereum transfers', async () => {
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
          const builder = (await createBuilder('AssetHubPolkadot', ['AssetHubPolkadot']))
            .from('AssetHubPolkadot')
            .to('Ethereum')
            .currency({ location: asset.location, amount: MOCK_AMOUNT })
            .address(MOCK_ETH_ADDRESS)
            .senderAddress(MOCK_ADDRESS)
          await validateTransfer(builder, signer)
        })
      })
    })

    describe.sequential('RelayToPara', () => {
      RELAYCHAINS.forEach(relayChain => {
        PARACHAINS.forEach(chain => {
          const symbol = getRelayChainSymbol(chain)
          if (!hasSupportForAsset(chain, symbol)) return
          it(`should create transfer tx - ${symbol} from ${relayChain} to ${chain}`, async () => {
            try {
              const builder = (await createBuilder(relayChain, [relayChain, chain]))
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

    describe.sequential('Hydration to AssetHub transfer - miscellaneous scenarios', () => {
      it('should create transfer tx from Hydration to AssetHubPolkadot', async () => {
        const builder = (await createBuilder('Hydration', ['Hydration', 'AssetHubPolkadot']))
          .from('Hydration')
          .to('AssetHubPolkadot')
          .currency({ symbol: ForeignAbstract('USDT1'), amount: MOCK_AMOUNT })
          .senderAddress(MOCK_ADDRESS)
          .address(MOCK_ADDRESS)
        expect(builder).toBeDefined()
      })

      it('should create transfer tx from BifrostPolkadot to AssetHubPolkadot - overridden asset', async () => {
        const tx = await (await createBuilder('BifrostPolkadot', ['BifrostPolkadot', 'AssetHubPolkadot']))
          .from('BifrostPolkadot')
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
        const tx = await (await createBuilder('Hydration', ['Hydration', 'AssetHubPolkadot']))
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

    describe.sequential('Auto API create', () => {
      it('should create transfer tx from Acala to Astar - auto API', async () => {
        const builder = (await createBuilder('Acala', ['Acala', 'Astar']))
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

    filteredChains.forEach(chain => {
      const scenarios = generateTransferScenarios(chain, useChopsticks)

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

      describe.sequential(`Transfer scenarios for origin ${chain}`, () => {
        describe.sequential('ParaToPara', () => {
          scenarios.forEach(({ destChain, asset }) => {
            it(`should create transfer tx from ${chain} to ${destChain} - (${asset.symbol})`, async () => {
              const getCurrency = (): TCurrencyCore => {
                if (asset.location) {
                  return { location: asset.location }
                }

                // Bifrost has duplicated asset ids, thus use symbol specifier
                if (!asset.isNative && asset.assetId && !chain.startsWith('Bifrost')) {
                  return { id: asset.assetId }
                }

                return { symbol: asset.symbol }
              }

              const currency = getCurrency()
              const senderAddress = isChainEvm(chain) ? MOCK_ETH_ADDRESS : MOCK_ADDRESS
              const address = isChainEvm(destChain) ? MOCK_ETH_ADDRESS : MOCK_ADDRESS
              try {
                const builder = (await createBuilder(chain, [chain, destChain]))
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
                    'UnsupportedOperationError',
                    'RuntimeApiUnavailableError'
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
              const builder = (await createBuilder(chain, [chain, relayChain]))
                .from(chain)
                .to(relayChain)
                .currency({ symbol, amount: MOCK_AMOUNT })
                .senderAddress(senderAddress)
                .address(MOCK_ADDRESS)
              await validateTransfer(builder, isChainEvm(chain) ? evmSigner : signer)
            } catch (error) {
              if (
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

      it(`should create local transfer tx on ${chain}`, async () => {
        const symbol = getRelayChainSymbol(chain)
        const address = isChainEvm(chain) ? MOCK_ETH_ADDRESS : MOCK_ADDRESS

        try {
          const builder = (await createBuilder(chain, [chain]))
            .from(chain)
            .to(chain)
            .currency({ symbol, amount: MOCK_AMOUNT })
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

  generateAssetsTests()
}
