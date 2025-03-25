import { describe, expect, it } from 'vitest'
import {
  determineRelayChain,
  GeneralBuilder,
  NODE_NAMES_DOT_KSM,
  NodeNotSupportedError,
  Parents,
  TApiOrUrl,
  TNodeDotKsmWithRelayChains,
  TNodePolkadotKusama,
  Version
} from '../src'
import { doesNotSupportParaToRelay, generateTransferScenarios } from './utils'
import { generateAssetsTests } from '../../assets/e2e'
import {
  findAsset,
  Foreign,
  ForeignAbstract,
  getOtherAssets,
  getRelayChainSymbol,
  hasSupportForAsset,
  isForeignAsset,
  isNodeEvm,
  Native
} from '@paraspell/assets'

const MOCK_AMOUNT = 1000000000000
const MOCK_ADDRESS = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'
const MOCK_ETH_ADDRESS = '0x1501C1413e4178c38567Ada8945A80351F7B8496'

export const generateE2eTests = <TApi, TRes, TSigner>(
  Builder: (api?: TApiOrUrl<TApi>) => GeneralBuilder<TApi, TRes>,
  createApiInstanceForNode: (node: TNodeDotKsmWithRelayChains) => Promise<TApi>,
  signer: TSigner,
  evmSigner: TSigner,
  validateTx: (tx: TRes, signer: TSigner) => Promise<void>,
  filteredNodes: TNodePolkadotKusama[]
) => {
  const reorderedNodes = filteredNodes.slice().sort((a, b) => {
    if (a === 'Acala') return 1 // Move a down if it is 'Acala'
    if (b === 'Acala') return -1 // Move b down if it is 'Acala'
    return 0 // Otherwise, maintain original order
  })

  describe.sequential('XCM - e2e', () => {
    const apiPool: Record<string, TApi> = {}

    const createOrGetApiInstanceForNode = async (node: TNodeDotKsmWithRelayChains) => {
      if (!apiPool[node]) {
        const api = await createApiInstanceForNode(node)
        apiPool[node] = api
      }
      return apiPool[node]
    }

    describe.sequential('Polkadot Kusama bridge', () => {
      it('should create bridge transfer tx AssetHubPolkadot -> AssetHubKusama (KSM)', async () => {
        const api = await createOrGetApiInstanceForNode('AssetHubPolkadot')
        const tx = await Builder(api)
          .from('AssetHubPolkadot')
          .to('AssetHubKusama')
          .currency({ symbol: 'KSM', amount: MOCK_AMOUNT })
          .address(MOCK_ADDRESS)
          .build()
        await validateTx(tx, signer)
      })

      it('should create bridge transfer tx AssetHubKusama -> AssetHubPolkadot (DOT)', async () => {
        const api = await createOrGetApiInstanceForNode('AssetHubKusama')
        const tx = await Builder(api)
          .from('AssetHubKusama')
          .to('AssetHubPolkadot')
          .currency({ symbol: 'DOT', amount: MOCK_AMOUNT })
          .address(MOCK_ADDRESS)
          .build()
        await validateTx(tx, signer)
      })

      it('should create bridge transfer tx AssetHubKusama -> AssetHubPolkadot (KSM)', async () => {
        const api = await createOrGetApiInstanceForNode('AssetHubKusama')
        const tx = await Builder(api)
          .from('AssetHubKusama')
          .to('AssetHubPolkadot')
          .currency({ symbol: 'KSM', amount: MOCK_AMOUNT })
          .address(MOCK_ADDRESS)
          .build()
        await validateTx(tx, signer)
      })
    })

    describe.sequential('AssetClaim', () => {
      ;(
        ['Polkadot', 'Kusama', 'AssetHubPolkadot', 'AssetHubKusama'] as TNodeDotKsmWithRelayChains[]
      ).forEach(node => {
        it('should create asset claim tx', async () => {
          const api = await createOrGetApiInstanceForNode(node)
          const tx = await Builder(api)
            .claimFrom(node)
            .fungible([
              {
                id: {
                  Concrete: {
                    parents: Parents.ZERO,
                    interior: 'Here'
                  }
                },
                fun: { Fungible: MOCK_AMOUNT }
              }
            ])
            .account(MOCK_ADDRESS)
            .build()
          await validateTx(tx, signer)
        })
      })

      it('should create asset claim tx V2', async () => {
        const api = await createOrGetApiInstanceForNode('AssetHubPolkadot')
        const tx = await Builder(api)
          .claimFrom('AssetHubPolkadot')
          .fungible([
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
          .account(MOCK_ADDRESS)
          .xcmVersion(Version.V2)
          .build()
        expect(tx).toBeDefined()
      })

      it('should create asset claim tx V3', async () => {
        const api = await createOrGetApiInstanceForNode('AssetHubPolkadot')
        const tx = await Builder(api)
          .claimFrom('AssetHubPolkadot')
          .fungible([
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
          .account(MOCK_ADDRESS)
          .xcmVersion(Version.V3)
          .build()
        await validateTx(tx, signer)
      })
    })

    describe.sequential('Ethereum transfers', async () => {
      const ethAssetSymbols = getOtherAssets('Ethereum').map(asset => asset.symbol)
      const api = await createOrGetApiInstanceForNode('AssetHubPolkadot')
      ethAssetSymbols.forEach(symbol => {
        if (!symbol) return
        it(`should create transfer tx - ${symbol} from Polkadot to Ethereum`, async () => {
          const tx = await Builder(api)
            .from('AssetHubPolkadot')
            .to('Ethereum')
            .currency({ symbol, amount: MOCK_AMOUNT })
            .address(MOCK_ETH_ADDRESS)
            .build()
          await validateTx(tx, signer)
        })
      })
    })

    describe.sequential('RelayToPara', () => {
      ;(['Polkadot', 'Kusama'] as TNodeDotKsmWithRelayChains[]).forEach(nodeRelay => {
        NODE_NAMES_DOT_KSM.forEach(node => {
          const symbol = getRelayChainSymbol(node)
          if (!hasSupportForAsset(node, symbol)) return
          it(`should create transfer tx - ${symbol} from ${nodeRelay} to ${node}`, async () => {
            const api = await createOrGetApiInstanceForNode(nodeRelay)
            try {
              const tx = await Builder(api)
                .from(nodeRelay)
                .to(node)
                .currency({ symbol, amount: MOCK_AMOUNT })
                .address(MOCK_ADDRESS)
                .build()
              await validateTx(tx, signer)
            } catch (error) {
              if (error instanceof NodeNotSupportedError) {
                expect(error).toBeInstanceOf(NodeNotSupportedError)
              }
            }
          })
        })
      })
    })

    describe.sequential('Hydration to AssetHub transfer', () => {
      it('should create transfer tx from Hydration to AssetHubPolkadot', async () => {
        const api = await createOrGetApiInstanceForNode('Hydration')
        const tx = await Builder(api)
          .from('Hydration')
          .to('AssetHubPolkadot')
          .currency({ symbol: ForeignAbstract('USDT1'), amount: MOCK_AMOUNT })
          .address(MOCK_ADDRESS)
          .build()
        expect(tx).toBeDefined()
      })

      it('should create transfer tx from Hydration to AssetHubPolkadot - overridden multiasset', async () => {
        const api = await createOrGetApiInstanceForNode('Hydration')
        const tx = await Builder(api)
          .from('Hydration')
          .to('AssetHubPolkadot')
          .currency({
            multiasset: [
              {
                symbol: 'WUD',
                amount: '102928'
              },
              {
                symbol: ForeignAbstract('USDC2'),
                amount: '38482'
              }
            ]
          })
          .feeAsset({ symbol: ForeignAbstract('USDC2') })
          .address(MOCK_ADDRESS)
          .build()

        expect(tx).toBeDefined()
      })

      it('should create transfer tx from Hydration to AssetHubPolkadot - overridden multiasset currency selection', async () => {
        const api = await createOrGetApiInstanceForNode('Hydration')
        const tx = await Builder(api)
          .from('Hydration')
          .to('AssetHubPolkadot')
          .currency({
            multiasset: [
              {
                id: {
                  Concrete: {
                    parents: 0,
                    interior: { X2: [{ PalletInstance: '50' }, { GeneralIndex: '31337' }] }
                  }
                },
                fun: { Fungible: '102928' }
              },
              {
                id: {
                  Concrete: {
                    parents: 0,
                    interior: { X2: [{ PalletInstance: '50' }, { GeneralIndex: '1337' }] }
                  }
                },
                fun: { Fungible: '38482' }
              }
            ],
            amount: MOCK_AMOUNT
          })
          .feeAsset({
            multilocation: {
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

    reorderedNodes.forEach(node => {
      const scenarios = generateTransferScenarios(node)
      const relayChainAsset = findAsset(
        node,
        { symbol: getRelayChainSymbol(node) },
        determineRelayChain(node)
      )
      const paraToRelaySupported = relayChainAsset && !doesNotSupportParaToRelay.includes(node)
      if (scenarios.length === 0 && !paraToRelaySupported) {
        return
      }
      describe.sequential(`Transfer scenarios for origin ${node}`, () => {
        describe.sequential('ParaToPara', () => {
          scenarios.forEach(({ destNode, asset }) => {
            it(`should create transfer tx from ${node} to ${destNode} - (${asset.symbol})`, async () => {
              const getCurrency = () => {
                if (node === 'Turing') {
                  return {
                    symbol: isForeignAsset(asset) ? Foreign(asset.symbol) : Native(asset.symbol)
                  }
                }

                // BifrostPolkadot has duplicated asset ids, thus use symbol specifier
                if (isForeignAsset(asset) && asset.assetId && node !== 'BifrostPolkadot') {
                  return { id: asset.assetId }
                }

                return { symbol: asset.symbol }
              }

              const currency = getCurrency()
              const resolvedAddress = isNodeEvm(destNode) ? MOCK_ETH_ADDRESS : MOCK_ADDRESS
              try {
                const api = await createOrGetApiInstanceForNode(node)
                const tx = await Builder(api)
                  .from(node)
                  .to(destNode)
                  .currency({
                    ...currency,
                    amount: MOCK_AMOUNT
                  })
                  .address(resolvedAddress)
                  .build()

                await validateTx(tx, isNodeEvm(node) ? evmSigner : signer)
              } catch (error) {
                if (error instanceof Error) {
                  if (error.name === 'ScenarioNotSupported') {
                    expect(error.name).toBe('ScenarioNotSupported')
                  } else if (error.name === 'NodeNotSupported') {
                    expect(error.name).toBe('NodeNotSupported')
                  } else if (error.name === 'NoXCMSupportImplemented') {
                    expect(error.name).toBe('NoXCMSupportImplemented')
                  } else {
                    throw error
                  }
                }
              }
            })
          })
        })

        if (relayChainAsset && !doesNotSupportParaToRelay.includes(node)) {
          it(`should create transfer tx - ParaToRelay ${getRelayChainSymbol(
            node
          )} from ${node} to Relay`, async () => {
            const api = await createOrGetApiInstanceForNode(node)
            const tx = await Builder(api)
              .from(node)
              .to(determineRelayChain(node))
              .currency({ symbol: getRelayChainSymbol(node), amount: MOCK_AMOUNT })
              .address(MOCK_ADDRESS)
              .build()
            await validateTx(tx, isNodeEvm(node) ? evmSigner : signer)
          })
        }
      })
    })
  })

  generateAssetsTests()
}
