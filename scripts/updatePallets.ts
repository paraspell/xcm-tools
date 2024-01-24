// Script that updates XCM Pallets map for compatible nodes

import { ApiPromise } from '@polkadot/api'
import { NODE_NAMES } from '../src/maps/consts'
import { TPallet, TPalletJsonMap, TPalletMap } from '../src/types'
import {
  checkForNodeJsEnvironment,
  fetchTryMultipleProvidersWithTimeout,
  readJsonOrReturnEmptyObject,
  writeJsonSync
} from './scriptUtils'

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

const fetchAllNodesPallets = async (assetsMapJson: any) => {
  const output: TPalletJsonMap = JSON.parse(JSON.stringify(assetsMapJson))
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

;(async () => {
  checkForNodeJsEnvironment()
  const JSON_FILE_PATH = './src/maps/pallets.json'
  const assetsJson = await readJsonOrReturnEmptyObject(JSON_FILE_PATH)
  const data = await fetchAllNodesPallets(assetsJson)
  writeJsonSync(JSON_FILE_PATH, data)
  console.log('Successfuly checked supported pallets')
  process.exit()
})()
