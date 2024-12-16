import { describe, it, expect, beforeAll } from 'vitest'
import {
  Builder,
  type TNode,
  createApiInstanceForNode,
  getAllAssetsSymbols,
  getRelayChainSymbol,
  NoXCMSupportImplementedError,
  ScenarioNotSupportedError,
  getAssetId,
  NodeNotSupportedError,
  getOtherAssets,
  Version,
  NODE_NAMES_DOT_KSM,
  getSupportedAssets,
  TNodeDotKsmWithRelayChains,
  ForeignAbstract,
  determineRelayChain,
  isNodeEvm
} from '../src'
import { type ApiPromise } from '@polkadot/api'
import { isForeignAsset } from '../src/utils/assets'
import { getAssetBySymbolOrId } from '../src/pallets/assets/getAssetBySymbolOrId'

const MOCK_AMOUNT = 1000
const MOCK_ADDRESS = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'
const MOCK_ETH_ADDRESS = '0x1501C1413e4178c38567Ada8945A80351F7B8496'
const MOCK_POLKADOT_NODE: TNode = 'Acala'
const MOCK_KUSAMA_NODE: TNode = 'Karura'

const getAssetsForNode = (node: TNode): string[] => {
  if (node === 'Pendulum') return ['PEN']
  if (node === 'Nodle') return ['NODL']
  if (node === 'Crust') return ['EQD']
  if (node === 'CrustShadow') return ['KAR']
  if (node === 'Khala') return ['PHA']
  if (node === 'Phala') return ['PHA']
  if (node === 'Mythos') return ['MYTH']
  if (node === 'Subsocial') return ['SUB']
  if (node === 'KiltSpiritnet') return ['KILT']
  return getAllAssetsSymbols(node)
}

const filteredNodes = NODE_NAMES_DOT_KSM.filter(
  node =>
    node !== 'Bitgreen' &&
    node !== 'Bajun' &&
    node !== 'CoretimeKusama' &&
    // Has no assets
    node !== 'Quartz' &&
    node !== 'Pendulum' &&
    node !== 'InvArchTinker' &&
    node !== 'Unique'
)

const findTransferableNodeAndAsset = (
  from: TNode
): { nodeTo: TNode | undefined; asset: string | undefined; assetId: string | null | undefined } => {
  const allFromAssets = getAssetsForNode(from)

  const nodeTo = NODE_NAMES_DOT_KSM.filter(
    node => getRelayChainSymbol(node) === getRelayChainSymbol(from) && node !== from
  ).find(node => {
    const nodeAssets = getAllAssetsSymbols(node)

    const filteredNodes =
      node === 'AssetHubPolkadot' || node === 'AssetHubKusama'
        ? nodeAssets.filter(
            symbol => symbol !== 'DOT' && symbol !== 'KSM' && symbol !== 'GLMR' && symbol !== 'KILT'
          )
        : nodeAssets

    const commonAsset = filteredNodes.filter(asset => allFromAssets.includes(asset))[0]
    return commonAsset !== undefined
  })

  if (nodeTo === 'AssetHubPolkadot' || nodeTo === 'AssetHubKusama') {
    const supportedAsset = getSupportedAssets(from, nodeTo).filter(
      asset => asset.symbol !== 'DOT' && asset.symbol !== 'KSM'
    )[0]
    return {
      nodeTo,
      asset: supportedAsset.symbol,
      assetId: isForeignAsset(supportedAsset) ? supportedAsset.assetId : null
    }
  }

  const foundAsset =
    nodeTo !== undefined
      ? getAllAssetsSymbols(nodeTo).filter(asset => allFromAssets.includes(asset))[0]
      : undefined

  return { nodeTo, asset: foundAsset, assetId: getAssetId(from, foundAsset ?? '') }
}

describe.sequential('XCM - e2e', () => {
  describe('AssetClaim', () => {
    ;(
      ['Polkadot', 'Kusama', 'AssetHubPolkadot', 'AssetHubKusama'] as TNodeDotKsmWithRelayChains[]
    ).forEach(node => {
      it('should create asset claim tx', async () => {
        const api = await createApiInstanceForNode(node)
        const tx = Builder(api)
          .claimFrom(node)
          .fungible([
            {
              id: {
                Concrete: {
                  parents: 0,
                  interior: {
                    Here: null
                  }
                }
              },
              fun: { Fungible: 1000 }
            }
          ])
          .account(MOCK_ADDRESS)
          .build()
        expect(tx).toBeDefined()
      })
    })

    it('should create bridge transfer tx AssetHubPolkadot -> AssetHubKusama (DOT)', async () => {
      const api = await createApiInstanceForNode('AssetHubPolkadot')
      const tx = Builder(api)
        .from('AssetHubPolkadot')
        .to('AssetHubKusama')
        .currency({ symbol: 'DOT' })
        .amount(MOCK_AMOUNT)
        .address(MOCK_ADDRESS)
        .build()
      expect(tx).toBeDefined()
    })

    it('should create bridge transfer tx AssetHubPolkadot -> AssetHubKusama (KSM)', async () => {
      const api = await createApiInstanceForNode('AssetHubPolkadot')
      const tx = Builder(api)
        .from('AssetHubPolkadot')
        .to('AssetHubKusama')
        .currency({ symbol: 'KSM' })
        .amount(MOCK_AMOUNT)
        .address(MOCK_ADDRESS)
        .build()
      expect(tx).toBeDefined()
    })

    it('should create bridge transfer tx AssetHubKusama -> AssetHubPolkadot (DOT)', async () => {
      const api = await createApiInstanceForNode('AssetHubPolkadot')
      const tx = Builder(api)
        .from('AssetHubKusama')
        .to('AssetHubPolkadot')
        .currency({ symbol: 'DOT' })
        .amount(MOCK_AMOUNT)
        .address(MOCK_ADDRESS)
        .build()
      expect(tx).toBeDefined()
    })

    it('should create bridge transfer tx AssetHubKusama -> AssetHubPolkadot (KSM)', async () => {
      const api = await createApiInstanceForNode('AssetHubPolkadot')
      const tx = Builder(api)
        .from('AssetHubKusama')
        .to('AssetHubPolkadot')
        .currency({ symbol: 'KSM' })
        .amount(MOCK_AMOUNT)
        .address(MOCK_ADDRESS)
        .build()
      expect(tx).toBeDefined()
    })

    it('should create asset claim tx V1', async () => {
      const api = await createApiInstanceForNode('AssetHubPolkadot')
      const tx = Builder(api)
        .claimFrom('AssetHubPolkadot')
        .fungible([
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  Here: null
                }
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

    it('should create asset claim tx V2', async () => {
      const api = await createApiInstanceForNode('AssetHubPolkadot')
      const tx = Builder(api)
        .claimFrom('AssetHubPolkadot')
        .fungible([
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  Here: null
                }
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

    it('should create asset claim tx V4', async () => {
      const api = await createApiInstanceForNode('AssetHubPolkadot')
      const tx = Builder(api)
        .claimFrom('AssetHubPolkadot')
        .fungible([
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  Here: null
                }
              }
            },
            fun: { Fungible: 1000 }
          }
        ])
        .account(MOCK_ADDRESS)
        .xcmVersion(Version.V3)
        .build()
      expect(tx).toBeDefined()
    })
  })

  describe('Ethereum transfers', async () => {
    const ethAssetSymbols = getOtherAssets('Ethereum').map(asset => asset.symbol)
    const api = await createApiInstanceForNode('AssetHubPolkadot')
    ethAssetSymbols.forEach(symbol => {
      if (!symbol) return
      it(`should create transfer tx - ${symbol} from AssetHubPolkadot to Ethereum`, async () => {
        const tx = await Builder(api)
          .from('AssetHubPolkadot')
          .to('Ethereum')
          .currency({ symbol })
          .amount(MOCK_AMOUNT)
          .address(MOCK_ETH_ADDRESS)
          .build()
        expect(tx).toBeDefined()
      })
    })
  })

  describe.sequential('RelayToPara', () => {
    it('should create transfer tx - DOT from Relay to Para', async () => {
      const api = await createApiInstanceForNode('Polkadot')
      const tx = await Builder(api)
        .to(MOCK_POLKADOT_NODE)
        .amount(MOCK_AMOUNT)
        .address(MOCK_ADDRESS)
        .build()
      expect(tx).toBeDefined()
    })
    it('should create transfer tx - KSM from Relay to Para', async () => {
      const api = await createApiInstanceForNode('Kusama')
      const tx = Builder(api).to(MOCK_KUSAMA_NODE).amount(MOCK_AMOUNT).address(MOCK_ADDRESS).build()
      expect(tx).toBeDefined()
    })
  })

  describe.sequential('Hydration to AssetHub transfer with feeAsset', () => {
    it('should create transfer tx from Hydration to AssetHubPolkadot with feeAsset(0)', async () => {
      const api = await createApiInstanceForNode('Hydration')
      const tx = await Builder(api)
        .from('Hydration')
        .to('AssetHubPolkadot')
        .currency({ symbol: ForeignAbstract('USDT1') })
        .feeAsset('0')
        .amount(MOCK_AMOUNT)
        .address(MOCK_ADDRESS)
        .build()
      expect(tx).toBeDefined()
    })
  })

  filteredNodes.forEach(node => {
    const { nodeTo, asset, assetId } = findTransferableNodeAndAsset(node)
    if (!nodeTo) return
    describe.sequential(`${node} ParaToPara & ParaToRelay`, () => {
      let api: ApiPromise
      beforeAll(async () => {
        api = await createApiInstanceForNode(node)
      })
      it(`should create transfer tx - ParaToPara ${asset} from ${node} to ${nodeTo}`, async () => {
        const currency = assetId ? { id: assetId } : { symbol: asset ?? 'DOT' }
        if (currency === null) return
        expect(nodeTo).toBeDefined()
        const resolvedNode = nodeTo ?? MOCK_POLKADOT_NODE
        const resolvedAddress = isNodeEvm(resolvedNode) ? MOCK_ETH_ADDRESS : MOCK_ADDRESS
        try {
          const tx = await Builder(api)
            .from(node)
            .to(resolvedNode)
            .currency(currency)
            .amount(MOCK_AMOUNT)
            .address(resolvedAddress)
            .build()
          expect(tx).toBeDefined()
        } catch (error) {
          if (error instanceof NoXCMSupportImplementedError) {
            expect(error).toBeInstanceOf(NoXCMSupportImplementedError)
          } else if (error instanceof ScenarioNotSupportedError) {
            expect(error).toBeInstanceOf(ScenarioNotSupportedError)
          } else if (error instanceof NodeNotSupportedError) {
            expect(error).toBeInstanceOf(NodeNotSupportedError)
          } else {
            throw error
          }
        }
      })

      if (
        node !== 'Crust' &&
        node !== 'CrustShadow' &&
        node !== 'Phala' &&
        node !== 'Khala' &&
        node !== 'Manta' &&
        node !== 'Turing' &&
        node !== 'Zeitgeist' &&
        node !== 'Picasso' &&
        node !== 'Parallel' &&
        node !== 'Moonriver' &&
        node !== 'Calamari' &&
        node !== 'Basilisk' &&
        node !== 'Amplitude' &&
        node !== 'Altair' &&
        node !== 'Moonbeam' &&
        node !== 'Hydration' &&
        node !== 'Darwinia' &&
        node !== 'ComposableFinance' &&
        node !== 'Centrifuge' &&
        node !== 'ParallelHeiko'
      ) {
        const relayChainAsset = getAssetBySymbolOrId(
          node,
          { symbol: getRelayChainSymbol(node) },
          determineRelayChain(node)
        )
        if (!relayChainAsset) return
        it(`should create transfer tx - ParaToRelay ${getRelayChainSymbol(
          node
        )} from ${node} to Relay`, async () => {
          try {
            const tx = await Builder(api)
              .from(node)
              .amount(MOCK_AMOUNT)
              .address(MOCK_ADDRESS)
              .build()
            expect(tx).toBeDefined()
          } catch (error) {
            if (error instanceof NoXCMSupportImplementedError) {
              expect(error).toBeInstanceOf(NoXCMSupportImplementedError)
            } else if (error instanceof ScenarioNotSupportedError) {
              expect(error).toBeInstanceOf(ScenarioNotSupportedError)
            } else if (error instanceof NodeNotSupportedError) {
              expect(error).toBeInstanceOf(NodeNotSupportedError)
            } else {
              throw error
            }
          }
        })
      }
    })
  })
})
