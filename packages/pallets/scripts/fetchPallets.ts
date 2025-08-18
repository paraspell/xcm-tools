import type { ApiPromise } from '@polkadot/api'
import type { TPallet, TPalletMap, TPalletJsonMap, TPalletDetails } from '../src'
import { fetchTryMultipleProvidersWithTimeout } from '../../sdk-common/scripts/scriptUtils'
import { getChainProviders } from '../../sdk-core/src'
import { SUBSTRATE_CHAINS } from '@paraspell/sdk-common'

const defaultPalletsByPriority: TPallet[] = [
  'XcmPallet',
  'XTransfer',
  'XTokens',
  'OrmlXTokens',
  'PolkadotXcm'
]

const nativeAssetPalletsByPriority = ['Balances', 'Currencies', 'Tokens'] as const

const otherAssetPalletsByPriority = [
  'Currencies',
  'Tokens',
  'Assets',
  'ForeignAssets',
  'AssetManager'
] as const

const fetchPallets = async (api: ApiPromise): Promise<TPalletDetails[]> => {
  const res = await api.rpc.state.getMetadata()
  return res.asLatest.pallets.map(val => ({
    name: val.name.toHuman() as TPallet,
    index: val.index.toNumber()
  }))
}

const composePalletMapObject = async (api: ApiPromise): Promise<TPalletMap> => {
  const palletDetails = await fetchPallets(api)

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
  ) as TPallet

  const otherAssetsPallets = otherAssetPalletsByPriority.filter(pallet =>
    palletDetails.map(item => item.name).includes(pallet)
  ) as TPallet[]

  return {
    defaultPallet,
    supportedPallets,
    nativeAssets: nativeAssetsPallet,
    otherAssets: otherAssetsPallets
  }
}

export const fetchAllChainsPallets = async (assetsMapJson: unknown) => {
  const output = JSON.parse(JSON.stringify(assetsMapJson)) as TPalletJsonMap
  for (const chain of SUBSTRATE_CHAINS) {
    console.log(`Fetching pallets for ${chain}...`)

    const newData = await fetchTryMultipleProvidersWithTimeout(chain, getChainProviders, api =>
      composePalletMapObject(api)
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
