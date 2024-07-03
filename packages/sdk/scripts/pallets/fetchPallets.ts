import { ApiPromise } from '@polkadot/api'
import { NODE_NAMES } from '../../src/maps/consts'
import { TPallet, TPalletMap, TPalletJsonMap } from '../../src/types'
import { fetchTryMultipleProvidersWithTimeout } from '../scriptUtils'

const defaultPalletsSortedByPriority: TPallet[] = [
  'XTransfer',
  'XTokens',
  'OrmlXTokens',
  'PolkadotXcm',
  'RelayerXcm'
]

const fetchPallets = async (api: ApiPromise) => {
  const res = await api.rpc.state.getMetadata()
  return res.asLatest.pallets.map(val => val.name.toHuman())
}

const composePalletMapObject = async (api: ApiPromise): Promise<TPalletMap> => {
  const pallets = (await fetchPallets(api)) as TPallet[]
  const supportedPallets = pallets.filter(pallet => defaultPalletsSortedByPriority.includes(pallet))
  const defaultPallet = defaultPalletsSortedByPriority.find(pallet =>
    supportedPallets.includes(pallet)
  ) as TPallet
  return {
    defaultPallet,
    supportedPallets
  }
}

export const fetchAllNodesPallets = async (assetsMapJson: unknown) => {
  const output = JSON.parse(JSON.stringify(assetsMapJson)) as TPalletJsonMap
  for (const node of NODE_NAMES) {
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
