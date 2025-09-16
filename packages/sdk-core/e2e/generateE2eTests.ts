import { describe, expect, it } from 'vitest'
import {
  getChainProviders,
  ChainNotSupportedError,
  Parents,
  TApiOrUrl,
  Version,
  getRelayChainOf,
  TSubstrateChain,
  TRelaychain,
  PARACHAINS,
  SUBSTRATE_CHAINS,
  TBuilderOptions
} from '../src'
import { GeneralBuilder } from '../dist'
import { doesNotSupportParaToRelay, generateTransferScenarios } from './utils'
import { generateAssetsTests } from '../../assets/e2e'
import {
  findAssetInfo,
  Foreign,
  ForeignAbstract,
  getNativeAssetSymbol,
  getOtherAssets,
  getRelayChainSymbol,
  hasSupportForAsset,
  isForeignAsset,
  isChainEvm,
  Native,
  TCurrencyCore
} from '@paraspell/assets'

const MOCK_AMOUNT = 1000000000000
const MOCK_ADDRESS = '1phKfRLnZm8iWTq5ki2xAPf5uwxjBrEe6Bc3Tw2bxPLx3t8'
const MOCK_ETH_ADDRESS = '0x1501C1413e4178c38567Ada8945A80351F7B8496'

export const generateE2eTests = <TApi, TRes, TSigner>(
  Builder: (api?: TBuilderOptions<TApiOrUrl<TApi>>) => GeneralBuilder<TApi, TRes>,
  createChainClient: (chain: TSubstrateChain) => Promise<TApi>,
  signer: TSigner,
  evmSigner: TSigner,
  validateTx: (tx: TRes, signer: TSigner) => Promise<void>,
  filteredChains: TSubstrateChain[],
  isPjs: boolean
) => {
  const reorderedChains = filteredChains.slice().sort((a, b) => {
    if (a === 'Acala') return 1 // Move a down if it is 'Acala'
    if (b === 'Acala') return -1 // Move b down if it is 'Acala'
    return 0 // Otherwise, maintain original order
  })

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

    describe.sequential('Polkadot Kusama bridge', () => {
      it('should create bridge transfer tx AssetHubPolkadot -> AssetHubKusama (KSM)', async () => {
        const api = await createOrGetApiInstanceForChain('AssetHubPolkadot')
        const tx = await Builder(api)
          .from('AssetHubPolkadot')
          .to('AssetHubKusama')
          .currency({
            location: {
              parents: 2,
              interior: { X1: [{ GlobalConsensus: { kusama: null } }] }
            },
            amount: MOCK_AMOUNT
          })
          .address(MOCK_ADDRESS)
          .build()
        await validateTx(tx, signer)
      })

      it('should create bridge transfer tx AssetHubKusama -> AssetHubPolkadot (DOT)', async () => {
        const api = await createOrGetApiInstanceForChain('AssetHubKusama')
        const tx = await Builder(api)
          .from('AssetHubKusama')
          .to('AssetHubPolkadot')
          .currency({
            location: {
              parents: 2,
              interior: { X1: [{ GlobalConsensus: { polkadot: null } }] }
            },
            amount: MOCK_AMOUNT
          })
          .address(MOCK_ADDRESS)
          .build()
        await validateTx(tx, signer)
      })

      it('should create bridge transfer tx AssetHubKusama -> AssetHubPolkadot (KSM)', async () => {
        const api = await createOrGetApiInstanceForChain('AssetHubKusama')
        const tx = await Builder(api)
          .from('AssetHubKusama')
          .to('AssetHubPolkadot')
          .currency({
            location: {
              parents: 1,
              interior: { Here: null }
            },
            amount: MOCK_AMOUNT
          })
          .address(MOCK_ADDRESS)
          .build()
        await validateTx(tx, signer)
      })
    })

    describe.sequential('AssetClaim', () => {
      ;(['Polkadot', 'Kusama', 'AssetHubPolkadot', 'AssetHubKusama'] as TSubstrateChain[]).forEach(
        chain => {
          it(`should create asset claim tx for ${chain}`, async () => {
            const api = await createOrGetApiInstanceForChain(chain)
            const tx = await Builder(api)
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
        }
      )

      it('should create asset claim tx V3', async () => {
        const api = await createOrGetApiInstanceForChain('AssetHubPolkadot')
        const tx = await Builder(api)
          .claimFrom('AssetHubPolkadot')
          .currency([
            {
              id: {
                Concrete: {
                  parents: 0,
                  interior: 'Here'
                }
              },
              fun: { Fungible: 1000 }
            }
          ])
          .address(MOCK_ADDRESS)
          .xcmVersion(Version.V3)
          .build()
        expect(tx).toBeDefined()
      })
    })

    describe.sequential('Ethereum transfers', async () => {
      const ethAssetSymbols = getOtherAssets('Ethereum').map(asset => asset.symbol)
      const api = await createOrGetApiInstanceForChain('AssetHubPolkadot')
      ethAssetSymbols.forEach(symbol => {
        if (!symbol) return
        it(`should create transfer tx - ${symbol} from Polkadot to Ethereum`, async () => {
          const tx = await Builder(api)
            .from('AssetHubPolkadot')
            .to('Ethereum')
            .currency({ symbol, amount: MOCK_AMOUNT })
            .address(MOCK_ETH_ADDRESS)
            .senderAddress(MOCK_ADDRESS)
            .build()
          await validateTx(tx, signer)
        })
      })
    })

    describe.sequential('RelayToPara', () => {
      ;(['Polkadot', 'Kusama'] as TRelaychain[]).forEach(relayChain => {
        PARACHAINS.forEach(chain => {
          const symbol = getRelayChainSymbol(chain)
          if (!hasSupportForAsset(chain, symbol)) return
          it(`should create transfer tx - ${symbol} from ${relayChain} to ${chain}`, async () => {
            const api = await createOrGetApiInstanceForChain(relayChain)
            try {
              const tx = await Builder(api)
                .from(relayChain)
                .to(chain)
                .currency({ symbol, amount: MOCK_AMOUNT })
                .address(MOCK_ADDRESS)
                .build()
              await validateTx(tx, signer)
            } catch (error) {
              if (error instanceof ChainNotSupportedError) {
                expect(error).toBeInstanceOf(ChainNotSupportedError)
              }
            }
          })
        })
      })
    })

    describe.sequential('Hydration to AssetHub transfer', () => {
      it('should create transfer tx from Hydration to AssetHubPolkadot', async () => {
        const api = await createOrGetApiInstanceForChain('Hydration')
        const tx = await Builder(api)
          .from('Hydration')
          .to('AssetHubPolkadot')
          .currency({ symbol: ForeignAbstract('USDT1'), amount: MOCK_AMOUNT })
          .address(MOCK_ADDRESS)
          .build()
        expect(tx).toBeDefined()
      })

      it('should create transfer tx from BifrostPolkadot to AssetHubPolkadot - overridden asset', async () => {
        const api = await createOrGetApiInstanceForChain('BifrostPolkadot')
        const tx = await Builder(api)
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
          .address(MOCK_ADDRESS)
          .build()

        expect(tx).toBeDefined()
      })

      it('should create transfer tx from Hydration to AssetHubPolkadot - overridden multiasset currency selection', async () => {
        const api = await createOrGetApiInstanceForChain('Hydration')
        const tx = await Builder(api)
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
          .address(MOCK_ADDRESS)
          .build()

        expect(tx).toBeDefined()
      })
    })

    describe.sequential('Auto API create', () => {
      it('should create transfer tx from Acala to Astar - auto API', async () => {
        const tx = await Builder()
          .from('Acala')
          .to('Astar')
          .currency({ symbol: 'DOT', amount: MOCK_AMOUNT })
          .address(MOCK_ADDRESS)
          .build()
        await validateTx(tx, signer)
      })

      it('should create transfer tx from Acala to Astar - WS url', async () => {
        const tx = await Builder('wss://acala-rpc.dwellir.com')
          .from('Acala')
          .to('Astar')
          .currency({ symbol: 'DOT', amount: MOCK_AMOUNT })
          .address(MOCK_ADDRESS)
          .build()
        await validateTx(tx, signer)
      })

      it('should create transfer tx from Acala to Astar - WS url array', async () => {
        const tx = await Builder(['wss://acala-rpc.dwellir.com', 'wss://acala.ibp.network'])
          .from('Acala')
          .to('Astar')
          .currency({ symbol: 'DOT', amount: MOCK_AMOUNT })
          .address(MOCK_ADDRESS)
          .build()
        await validateTx(tx, signer)
      })
    })

    reorderedChains.forEach(chain => {
      const scenarios = generateTransferScenarios(chain)

      const relayChainSymbol = getRelayChainSymbol(chain)

      const relayChainAsset = findAssetInfo(
        chain,
        // Use native selector for AssetHub chains because of duplicates
        { symbol: chain.includes('AssetHub') ? Native(relayChainSymbol) : relayChainSymbol },
        getRelayChainOf(chain)
      )
      const paraToRelaySupported = relayChainAsset && !doesNotSupportParaToRelay.includes(chain)
      if (scenarios.length === 0 && !paraToRelaySupported) {
        return
      }
      describe.sequential(`Transfer scenarios for origin ${chain}`, () => {
        describe.sequential('ParaToPara', () => {
          scenarios.forEach(({ destChain, asset }) => {
            it(`should create transfer tx from ${chain} to ${destChain} - (${asset.symbol})`, async () => {
              const getCurrency = (): TCurrencyCore => {
                if (
                  (chain.startsWith('AssetHub') ||
                    chain === 'Astar' ||
                    chain === 'Hydration' ||
                    chain === 'KiltSpiritnet') &&
                  asset.symbol.toUpperCase() === getNativeAssetSymbol(chain)
                ) {
                  return {
                    symbol: Native(asset.symbol)
                  }
                }

                // Bifrost has duplicated asset ids, thus use symbol specifier
                if (isForeignAsset(asset) && asset.assetId && !chain.includes('Bifrost')) {
                  return { id: asset.assetId }
                }

                if (chain === 'BifrostPaseo') {
                  return {
                    symbol: asset.symbol === 'KSM' ? Native(asset.symbol) : Foreign(asset.symbol)
                  }
                }

                return { symbol: asset.symbol }
              }

              const currency = getCurrency()
              const senderAddress = isChainEvm(chain) ? MOCK_ETH_ADDRESS : MOCK_ADDRESS
              const address = isChainEvm(destChain) ? MOCK_ETH_ADDRESS : MOCK_ADDRESS
              try {
                const api = await createOrGetApiInstanceForChain(chain)
                const tx = await Builder(api)
                  .from(chain)
                  .to(destChain)
                  .currency({
                    ...currency,
                    amount: MOCK_AMOUNT
                  })
                  .address(address)
                  .senderAddress(senderAddress)
                  .build()

                await validateTx(tx, isChainEvm(chain) ? evmSigner : signer)
              } catch (error) {
                if (error instanceof Error) {
                  if (error.name === 'ScenarioNotSupported') {
                    expect(error.name).toBe('ScenarioNotSupported')
                  } else if (error.name === 'ChainNotSupported') {
                    expect(error.name).toBe('ChainNotSupported')
                  } else if (error.name === 'NoXCMSupportImplemented') {
                    expect(error.name).toBe('NoXCMSupportImplemented')
                  } else if (error.name === 'IncompatibleChains') {
                    expect(error.name).toBe('IncompatibleChains')
                  } else if (error.name === 'TransferToAhNotSupported') {
                    expect(error.name).toBe('TransferToAhNotSupported')
                  } else if (error.message.includes('LocalExecutionIncomplete')) {
                    // Handle DryRunFailedError: LocalExecutionIncomplete
                    expect(error.message).toContain('LocalExecutionIncomplete')
                  } else if (
                    error.name === 'InvalidParameterError' &&
                    (error.message.includes('Relaychain assets can only be transferred') ||
                      error.message.includes(
                        'Astar system asset transfers are temporarily disabled'
                      ) ||
                      error.message.includes('temporarily disabled'))
                  ) {
                    expect(error.name).toBe('InvalidParameterError')
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
            const symbol = chain.startsWith('AssetHub')
              ? Native(getRelayChainSymbol(chain))
              : getRelayChainSymbol(chain)
            const api = await createOrGetApiInstanceForChain(chain)
            const senderAddress = isChainEvm(chain) ? MOCK_ETH_ADDRESS : MOCK_ADDRESS
            try {
              const tx = await Builder(api)
                .from(chain)
                .to(getRelayChainOf(chain))
                .currency({ symbol, amount: MOCK_AMOUNT })
                .senderAddress(senderAddress)
                .address(MOCK_ADDRESS)
                .build()
              await validateTx(tx, isChainEvm(chain) ? evmSigner : signer)
            } catch (error) {
              if (
                error.name === 'InvalidParameterError' &&
                (error.message.includes('Relaychain assets can only be transferred') ||
                  error.message.includes('Astar system asset transfers are temporarily disabled') ||
                  error.message.includes('temporarily disabled'))
              ) {
                expect(error.name).toBe('InvalidParameterError')
              } else {
                throw error
              }
            }
          })
        }
      })
    })

    describe.sequential('Local transfers (origin = destination)', () => {
      SUBSTRATE_CHAINS.forEach(chain => {
        it(`should create local transfer tx on ${chain}`, async () => {
          const api = await createOrGetApiInstanceForChain(chain)
          const symbol = getRelayChainSymbol(chain)
          const address = isChainEvm(chain) ? MOCK_ETH_ADDRESS : MOCK_ADDRESS

          try {
            const tx = await Builder(api)
              .from(chain)
              .to(chain)
              .currency({ symbol, amount: MOCK_AMOUNT })
              .address(address)
              .build()
            await validateTx(tx, isChainEvm(chain) ? evmSigner : signer)
          } catch (error) {
            if (error instanceof ChainNotSupportedError) {
              expect(error).toBeInstanceOf(ChainNotSupportedError)
            }
          }
        })
      })
    })
  })

  generateAssetsTests()
}
