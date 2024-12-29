import type { ApiPromise } from '@polkadot/api'
import { NODES_WITH_RELAY_CHAINS_DOT_KSM } from '../../src/constants'
import type { TPallet, TPalletMap, TPalletJsonMap, TPalletDetails } from '../../src/types'
import { fetchTryMultipleProvidersWithTimeout } from '../scriptUtils'

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

export const fetchAllNodesPallets = async (assetsMapJson: unknown) => {
  const output = JSON.parse(JSON.stringify(assetsMapJson)) as TPalletJsonMap
  for (const node of NODES_WITH_RELAY_CHAINS_DOT_KSM) {
    console.log(`Fetching pallets for ${node}...`)

    const newData = await fetchTryMultipleProvidersWithTimeout(node, api =>
      composePalletMapObject(api)
    )
    const isError = newData === null
    const oldData = Object.prototype.hasOwnProperty.call(output, node) ? output[node] : null

    // If we don't have newData and also oldData continue to another node
    // Error has to be solved manually by developer
    // Unit tests will fail
    if (!newData && !oldData) {
      continue
    }

    // In case we cannot fetch data for some node. Keep existing
    output[node] = isError && oldData ? oldData : (newData as TPalletMap)
  }
  return output
}
