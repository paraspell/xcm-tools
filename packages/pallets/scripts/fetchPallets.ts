import type { ApiPromise } from '@polkadot/api'
import type { TPallet, TPalletMap, TPalletJsonMap, TPalletDetails, TAssetsPallet } from '../src'
import { fetchTryMultipleProvidersWithTimeout } from '../../sdk-common/scripts/scriptUtils'
import { SUBSTRATE_CHAINS, TSubstrateChain } from '@paraspell/sdk-common'
import { getChainProviders } from '../../sdk-core/dist'

const defaultPalletsByPriority: TPallet[] = ['XcmPallet', 'XTransfer', 'XTokens', 'PolkadotXcm']

const nativeAssetPalletsByPriority: TAssetsPallet[] = ['Balances', 'Currencies', 'Tokens']

const otherAssetPalletsByPriority: TAssetsPallet[] = [
  'Currencies',
  'Tokens',
  'Assets',
  'ForeignAssets',
  'AssetManager',
  'Fungibles',
  'OrmlTokens'
]

const fetchPallets = async (api: ApiPromise) => {
  const res = await api.rpc.state.getMetadata()

  const palletsWithExtrinsics: TPalletDetails[] = []
  const palletsWithoutExtrinsics: TPalletDetails[] = []

  res.asLatest.pallets.forEach(val => {
    const name = val.name.toHuman()
    const methodName = name.charAt(0).toLowerCase() + name.slice(1)
    const hasExtrinsics = !!api.tx[methodName]
    const pallet = {
      name: name as TPallet,
      index: val.index.toNumber()
    }

    if (hasExtrinsics) {
      palletsWithExtrinsics.push(pallet)
    } else {
      palletsWithoutExtrinsics.push(pallet)
    }
  })

  return [palletsWithExtrinsics, palletsWithoutExtrinsics]
}

const composePalletMapObject = async (
  api: ApiPromise,
  chain: TSubstrateChain
): Promise<TPalletMap> => {
  const [palletDetails, palletDetailsWithoutExtrinsics] = await fetchPallets(api)

  const allPallets = [
    ...defaultPalletsByPriority,
    ...nativeAssetPalletsByPriority,
    ...otherAssetPalletsByPriority
  ]

  const supportedPallets = palletDetails.filter(pallet => allPallets.includes(pallet.name))

  const defaultPallet = defaultPalletsByPriority.find(pallet =>
    supportedPallets.map(item => item.name).includes(pallet)
  ) as TPallet

  const nativeAssetsPallet = nativeAssetPalletsByPriority.find(pallet =>
    palletDetails.map(item => item.name).includes(pallet)
  ) as TAssetsPallet

  const otherAssetsPallets = chain.startsWith('Moon')
    ? (['System'] as TAssetsPallet[])
    : (otherAssetPalletsByPriority.filter(pallet =>
        palletDetails.map(item => item.name).includes(pallet)
      ) as TAssetsPallet[])

  const additionalOtherPallets = otherAssetPalletsByPriority.filter(pallet =>
    palletDetailsWithoutExtrinsics.map(item => item.name).includes(pallet)
  ) as TAssetsPallet[]

  return {
    defaultPallet,
    supportedPallets,
    nativeAssets: nativeAssetsPallet,
    otherAssets: [...otherAssetsPallets, ...additionalOtherPallets]
  }
}

export const fetchAllChainsPallets = async (assetsMapJson: unknown) => {
  const output = JSON.parse(JSON.stringify(assetsMapJson)) as TPalletJsonMap
  for (const chain of SUBSTRATE_CHAINS) {
    console.log(`Fetching pallets for ${chain}...`)

    const newData = await fetchTryMultipleProvidersWithTimeout(chain, getChainProviders, api =>
      composePalletMapObject(api, chain)
    )
    const isError = newData === null
    const oldData = Object.prototype.hasOwnProperty.call(output, chain) ? output[chain] : null

    // If we don't have newData and also oldData continue to another chain
    // Error has to be solved manually by developer
    // Unit tests will fail
    if (!newData && !oldData) {
      continue
    }

    // In case we cannot fetch data for some chain. Keep existing
    output[chain] = isError && oldData ? oldData : (newData as TPalletMap)
  }
  return output
}
