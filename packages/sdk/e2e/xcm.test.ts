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
  TNodeWithRelayChains,
  Version,
  NODE_NAMES_DOT_KSM
} from '../src'
import { type ApiPromise } from '@polkadot/api'

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
  if (node === 'Integritee') return getAllAssetsSymbols(node).filter(asset => asset !== 'KSM')
  return getAllAssetsSymbols(node)
}

const filteredNodes = NODE_NAMES_DOT_KSM.filter(
  node =>
    node !== 'Quartz' &&
    node !== 'Bitgreen' &&
    node !== 'Bajun' &&
    node !== 'CoretimeKusama' &&
    node !== 'Polkadex'
)

const findTransferableNodeAndAsset = (
  from: TNode
): { nodeTo: TNode | undefined; asset: string | undefined; assetId: string | null } => {
  const allFromAssets = getAssetsForNode(from)

  const nodeTo = NODE_NAMES_DOT_KSM.filter(
    node => getRelayChainSymbol(node) === getRelayChainSymbol(from)
  ).find(node => {
    const nodeAssets = getAllAssetsSymbols(node)
    const commonAsset = nodeAssets.filter(asset => allFromAssets.includes(asset))[0]
    return commonAsset !== undefined
  })

  const foundAsset =
    nodeTo !== undefined
      ? getAllAssetsSymbols(nodeTo).filter(asset => allFromAssets.includes(asset))[0]
      : undefined

  return { nodeTo, asset: foundAsset, assetId: getAssetId(from, foundAsset ?? '') }
}

describe.sequential('XCM - e2e', () => {
  describe('AssetClaim', () => {
    ;(
      ['Polkadot', 'Kusama', 'AssetHubPolkadot', 'AssetHubKusama'] as TNodeWithRelayChains[]
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
        .currency('DOT')
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
        .currency('KSM')
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
        .currency('DOT')
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
        .currency('KSM')
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
      it(`should create transfer tx - ${symbol} from Polkadot to Ethereum`, async () => {
        const tx = await Builder(api)
          .from('AssetHubPolkadot')
          .to('Ethereum')
          .currency(symbol as string)
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

  filteredNodes.forEach(node => {
    describe.sequential(`${node} ParaToPara & ParaToRelay`, () => {
      let api: ApiPromise
      const { nodeTo, asset, assetId } = findTransferableNodeAndAsset(node)
      beforeAll(async () => {
        api = await createApiInstanceForNode(node)
      })
      it(`should create transfer tx - ParaToPara ${asset} from ${node} to ${nodeTo}`, async () => {
        const currency = assetId ?? asset ?? 'DOT'
        if (currency === null) return
        expect(nodeTo).toBeDefined()
        try {
          const tx = await Builder(api)
            .from(node)
            .to(nodeTo ?? MOCK_POLKADOT_NODE)
            .currency(currency)
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

      if (
        node !== 'Integritee' &&
        node !== 'Crust' &&
        node !== 'CrustShadow' &&
        node !== 'Phala' &&
        node !== 'Khala'
      ) {
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
