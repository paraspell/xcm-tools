import type { ApiPromise } from '@polkadot/api'
import type { TPallet, TPalletMap, TPalletJsonMap, TPalletDetails } from '../src'
import { fetchTryMultipleProvidersWithTimeout } from '../../sdk-common/scripts/scriptUtils'
import { getChainProviders } from '../../sdk-core/src'
import { CHAINS_WITH_RELAY_CHAINS_DOT_KSM } from '@paraspell/sdk-common'

const defaultPalletsSortedByPriority: TPallet[] = [
  'XcmPallet',
  'XTransfer',
  'XTokens',
  'OrmlXTokens',
  'PolkadotXcm',
  'RelayerXcm'
]

const fetchPallets = async (api: ApiPromise): Promise<TPalletDetails[]> => {
  const res = await api.rpc.state.getMetadata()
  return res.asLatest.pallets.map(val => ({
    name: val.name.toHuman() as TPallet,
    index: val.index.toNumber()
  }))
}

const composePalletMapObject = async (api: ApiPromise): Promise<TPalletMap> => {
  const palletDetails = await fetchPallets(api)
  const supportedPallets = palletDetails.filter(pallet =>
    defaultPalletsSortedByPriority.includes(pallet.name)
  )
  const defaultPallet = defaultPalletsSortedByPriority.find(pallet =>
    supportedPallets.map(item => item.name).includes(pallet)
  ) as TPallet
  return {
    defaultPallet,
    supportedPallets
  }
}

export const fetchAllChainsPallets = async (assetsMapJson: unknown) => {
  const output = JSON.parse(JSON.stringify(assetsMapJson)) as TPalletJsonMap
  for (const chain of CHAINS_WITH_RELAY_CHAINS_DOT_KSM) {
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
