import { describe, it, expect, beforeAll } from 'vitest'
import {
  type TNode,
  createApiInstanceForNode,
  getAllAssetsSymbols,
  getRelayChainSymbol,
  NoXCMSupportImplementedError,
  ScenarioNotSupportedError,
  getAssetId,
  NodeNotSupportedError,
  TNodeWithRelayChains,
  NODE_NAMES_DOT_KSM,
  getSupportedAssets,
  Builder,
  Version,
  getOtherAssets,
  TNodePolkadotKusama
} from '../src/papi'
import { getPolkadotSigner, PolkadotSigner } from 'polkadot-api/signer'

import { ecdsaCreateDerive, sr25519CreateDerive } from '@polkadot-labs/hdkd'
import { DEV_PHRASE, entropyToMiniSecret, mnemonicToEntropy } from '@polkadot-labs/hdkd-helpers'
import { TPapiTransaction } from '../src/papi/types'
import { PolkadotClient } from 'polkadot-api'

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
  if (node === 'Integritee') return getAllAssetsSymbols(node).filter(asset => asset !== 'KSM')
  return getAllAssetsSymbols(node)
}

const filteredNodes = NODE_NAMES_DOT_KSM.filter(
  node =>
    node !== 'Quartz' &&
    node !== 'Bitgreen' &&
    node !== 'Bajun' &&
    node !== 'CoretimeKusama' &&
    node !== 'ComposableFinance' &&
    node !== 'Interlay' &&
    node !== 'Parallel' &&
    node !== 'Pioneer' &&
    node !== 'CrustShadow' &&
    node !== 'Kintsugi' &&
    node !== 'ParallelHeiko' &&
    node !== 'Picasso' &&
    node !== 'Robonomics' &&
    node !== 'Turing' &&
    node !== 'Pendulum' &&
    node !== 'Polkadex' &&
    node !== 'Subsocial' &&
    node !== 'Litmus' &&
    // Moonbeam, Moonriver - Bad input data provided to account_nonce: Input buffer has still data left after decoding!
    node !== 'Moonbeam' &&
    node !== 'Moonriver' &&
    node !== 'Darwinia'
)

const findTransferableNodeAndAsset = (
  from: TNode
): { nodeTo: TNode | undefined; asset: string | undefined; assetId: string | null } => {
  const allFromAssets = getAssetsForNode(from)

  const nodeTo = NODE_NAMES_DOT_KSM.filter(
    node => getRelayChainSymbol(node) === getRelayChainSymbol(from) && node !== from
  ).find(node => {
    const nodeAssets = getAllAssetsSymbols(node)

    const filteredNodes =
      node === 'AssetHubPolkadot' || node === 'AssetHubKusama'
        ? nodeAssets.filter(symbol => symbol !== 'DOT' && symbol !== 'KSM')
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
      assetId: supportedAsset.assetId ?? null
    }
  }

  const foundAsset =
    nodeTo !== undefined
      ? getAllAssetsSymbols(nodeTo).filter(asset => allFromAssets.includes(asset))[0]
      : undefined

  return { nodeTo, asset: foundAsset, assetId: getAssetId(from, foundAsset ?? '') }
}

const validateTx = async (tx: TPapiTransaction, signer: PolkadotSigner) => {
  expect(tx).toBeDefined()
  const hex = await tx.sign(signer)
  expect(hex).toBeDefined()
}

describe.sequential('XCM - e2e', () => {
  const apiPool: Record<string, PolkadotClient> = {}

  async function createOrGetApiInstanceForNode(
    node: TNodeWithRelayChains
  ): Promise<PolkadotClient> {
    if (!apiPool[node]) {
      const api = await createApiInstanceForNode(node)
      apiPool[node] = api
    }
    return apiPool[node]
  }

  const miniSecret = entropyToMiniSecret(mnemonicToEntropy(DEV_PHRASE))
  const derive = sr25519CreateDerive(miniSecret)
  const aliceKeyPair = derive('//Alice')
  const signer = getPolkadotSigner(aliceKeyPair.publicKey, 'Sr25519', aliceKeyPair.sign)

  const deriveEvm = ecdsaCreateDerive(miniSecret)
  const aliceKeyPairEvm = deriveEvm('//Alice//0')
  const evmSigner = getPolkadotSigner(aliceKeyPairEvm.publicKey, 'Ecdsa', aliceKeyPairEvm.sign)

  describe('AssetClaim', () => {
    ;(
      ['Polkadot', 'Kusama', 'AssetHubPolkadot', 'AssetHubKusama'] as TNodeWithRelayChains[]
    ).forEach(node => {
      it('should create asset claim tx', async () => {
        const api = await createOrGetApiInstanceForNode(node)
        const tx = await Builder(api)
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
        await validateTx(tx, signer)
      })
    })

    it('should create bridge transfer tx AssetHubPolkadot -> AssetHubKusama (KSM)', async () => {
      const api = await createOrGetApiInstanceForNode('AssetHubPolkadot')
      const tx = await Builder(api)
        .from('AssetHubPolkadot')
        .to('AssetHubKusama')
        .currency({ symbol: 'KSM' })
        .amount(MOCK_AMOUNT)
        .address(MOCK_ADDRESS)
        .build()
      await validateTx(tx, signer)
    })
    it('should create bridge transfer tx AssetHubKusama -> AssetHubPolkadot (DOT)', async () => {
      const api = await createOrGetApiInstanceForNode('AssetHubKusama')
      const tx = await Builder(api)
        .from('AssetHubKusama')
        .to('AssetHubPolkadot')
        .currency({ symbol: 'DOT' })
        .amount(MOCK_AMOUNT)
        .address(MOCK_ADDRESS)
        .build()
      await validateTx(tx, signer)
    })
    it('should create bridge transfer tx AssetHubKusama -> AssetHubPolkadot (KSM)', async () => {
      const api = await createOrGetApiInstanceForNode('AssetHubKusama')
      const tx = await Builder(api)
        .from('AssetHubKusama')
        .to('AssetHubPolkadot')
        .currency({ symbol: 'KSM' })
        .amount(MOCK_AMOUNT)
        .address(MOCK_ADDRESS)
        .build()
      await validateTx(tx, signer)
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

    it('should create asset claim tx V3', async () => {
      const api = await createOrGetApiInstanceForNode('AssetHubPolkadot')
      const tx = await Builder(api)
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
      await validateTx(tx, signer)
    })
  })

  describe('Ethereum transfers', async () => {
    const ethAssetSymbols = getOtherAssets('Ethereum').map(asset => asset.symbol)
    const api = await createOrGetApiInstanceForNode('AssetHubPolkadot')
    ethAssetSymbols.forEach(symbol => {
      if (!symbol) return
      it(`should create transfer tx - ${symbol} from Polkadot to Ethereum`, async () => {
        const tx = await Builder(api)
          .from('AssetHubPolkadot')
          .to('Ethereum')
          .currency({ symbol })
          .amount(MOCK_AMOUNT)
          .address(MOCK_ETH_ADDRESS)
          .build()
        await validateTx(tx, signer)
      })
    })
  })

  describe.sequential('RelayToPara', () => {
    it('should create transfer tx - DOT from Relay to Para', async () => {
      const api = await createOrGetApiInstanceForNode('Polkadot')
      const tx = await Builder(api)
        .to(MOCK_POLKADOT_NODE)
        .amount(MOCK_AMOUNT)
        .address(MOCK_ADDRESS)
        .build()
      await validateTx(tx, signer)
    })
    it('should create transfer tx - KSM from Relay to Para', async () => {
      const api = await createOrGetApiInstanceForNode('Kusama')
      const tx = await Builder(api)
        .to(MOCK_KUSAMA_NODE)
        .amount(MOCK_AMOUNT)
        .address(MOCK_ADDRESS)
        .build()
      await validateTx(tx, signer)
    })
  })

  describe.sequential('Hydration to AssetHub transfer with feeAsset', () => {
    it('should create transfer tx from Hydration to AssetHubPolkadot with feeAsset(0)', async () => {
      const api = await createOrGetApiInstanceForNode('Hydration')
      const tx = await Builder(api)
        .from('Hydration')
        .to('AssetHubPolkadot')
        .currency({ symbol: 'USDT' })
        .feeAsset('0')
        .amount(MOCK_AMOUNT)
        .address(MOCK_ADDRESS)
        .build()
      await validateTx(tx, signer)
    })
  })
  ;['Darwinia' as TNodePolkadotKusama].forEach(node => {
    describe.sequential(`${node} ParaToPara & ParaToRelay`, () => {
      let api: PolkadotClient
      const { nodeTo, asset, assetId } = findTransferableNodeAndAsset(node)
      beforeAll(async () => {
        api = await createOrGetApiInstanceForNode(node)
      })
      it(`should create transfer tx - ParaToPara ${asset} from ${node} to ${nodeTo}`, async () => {
        const currency = assetId ? { id: assetId } : { symbol: asset ?? 'DOT' }
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

          if (node === 'Mythos' || node === 'Crab' || node === 'Darwinia') {
            await validateTx(tx, evmSigner)
          } else {
            await validateTx(tx, signer)
          }
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
      if (node !== 'Integritee' && node !== 'Crust' && node !== 'Phala' && node !== 'Khala') {
        // it(`should create transfer tx - ParaToRelay ${getRelayChainSymbol(
        //   node
        // )} from ${node} to Relay`, async () => {
        //   try {
        //     const tx = await Builder(api)
        //       .from(node)
        //       .amount(MOCK_AMOUNT)
        //       .address(MOCK_ADDRESS)
        //       .build()
        //     expect(tx).toBeDefined()
        //   } catch (error) {
        //     if (error instanceof NoXCMSupportImplementedError) {
        //       expect(error).toBeInstanceOf(NoXCMSupportImplementedError)
        //     } else if (error instanceof ScenarioNotSupportedError) {
        //       expect(error).toBeInstanceOf(ScenarioNotSupportedError)
        //     } else if (error instanceof NodeNotSupportedError) {
        //       expect(error).toBeInstanceOf(NodeNotSupportedError)
        //     } else {
        //       throw error
        //     }
        //   }
        // })
      }
    })
  })
})
