// Script that updates asset map for compatible nodes

import { ApiPromise } from '@polkadot/api'
import { NODE_NAMES } from '../maps/consts'
import { TAssetJsonMap, TNativeAssetDetails, TNode, TNodeAssets } from '../types'
import { getNode, getNodeEndpointOption } from '../utils'
import {
  checkForNodeJsEnvironment,
  readJsonOrReturnEmptyObject,
  fetchTryMultipleProvidersWithTimeout,
  writeJsonSync
} from './scriptUtils'

type NodeToAssetModuleMap = Record<TNode, string | null>

const nodeToQuery: NodeToAssetModuleMap = {
  // Chain state query: <module>.<section> for assets metadata
  Acala: 'assetRegistry.assetMetadatas',
  Astar: 'assets.metadata',
  BifrostPolkadot: null, // Has no foreign assets. Native assets are fetched directly from state.getMetadata()
  Bitgreen: null, // No assets metadata query
  Centrifuge: 'ormlAssetRegistry.metadata',
  Clover: 'assets.metadata',
  ComposableFinance: null, // No assets metadata query
  Darwinia: null, // No assets metadata query
  HydraDX: null, // Assets query returns empty array
  Interlay: 'assetRegistry.metadata',
  Kylin: 'assets.metadata',
  Litentry: null, // Assets query returns empty array
  Moonbeam: 'assets.metadata',
  Parallel: 'assets.metadata',
  Statemint: 'assets.metadata',
  Altair: null, // Assets query returns empty array
  Amplitude: null, // No assets metadata query
  Bajun: null, // No assets metadata query
  Basilisk: 'assetRegistry.assetMetadataMap',
  BifrostKusama: null, // Has no foreign assets created yet
  Calamari: 'assets.metadata',
  Crab: null, // No assets metadata query
  CrustShadow: 'assets.metadata',
  Dorafactory: null, // No assets metadata query
  Encointer: null, // No assets metadata query
  Imbue: null, // Assets query returns empty array
  Integritee: null, // No assets metadata query
  InvArchTinker: null, // Assets query returns empty array
  Kico: 'currencies.dicoAssetsInfo',
  Karura: 'assetRegistry.assetMetadatas',
  Kintsugi: 'assetRegistry.metadata',
  Litmus: null, // Assets query returns empty array
  Mangata: 'assetRegistry.metadata',
  Moonriver: 'assets.metadata',
  ParallelHeiko: 'assets.metadata',
  Picasso: null, // Assets query returns empty array
  Pichiu: 'assets.metadata',
  Pioneer: null, // Assets query returns empty array
  Quartz: null, // No assets metadata query
  Robonomics: 'assets.metadata',
  Shiden: 'assets.metadata',
  Statemine: 'assets.metadata',
  Turing: 'assetRegistry.metadata',
  Equilibrium: null, // No foreign assets metadata query
  Unique: null, // Foreign assets query returns empty array
  Crust: 'assets.metadata',
  Efinity: null, // No foreign assets metadata query
  Ipci: 'assets.metadata'
}

const fetchNativeAssets = async (api: ApiPromise): Promise<TNativeAssetDetails[]> => {
  const propertiesRes = await api.rpc.system.properties()
  const json = propertiesRes.toHuman()
  const symbols = json.tokenSymbol as string[]
  const decimals = json.tokenDecimals as string[]
  return symbols.map((symbol, i) => ({ symbol, decimals: +decimals[i] }))
}

const fetchBifrostNativeAssets = async (api: ApiPromise): Promise<TNativeAssetDetails[]> => {
  const res = await api.rpc.state.getMetadata()
  const TYPE_ID = 114
  const DEFAULT_DECIMALS = -1
  // Decimals for Bifrost Polkadot will be set to -1 and later derived from other assets
  return res.asLatest.lookup.types.at(TYPE_ID)!.type.def.asVariant.variants.map(k => ({
    symbol: k.name.toHuman(),
    decimals: DEFAULT_DECIMALS
  }))
}

const fetchOtherAssets = async (api: ApiPromise, query: string) => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()
  return res.map(
    ([
      {
        args: [era]
      },
      value
    ]) => {
      const { symbol, decimals } = value.toHuman() as any
      return {
        assetId: era.toString(),
        symbol,
        decimals: +decimals
      }
    }
  )
}

const fetchOtherAssetsCentrifuge = async (api: ApiPromise, query: string) => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()
  return res
    .filter(
      ([
        {
          args: [era]
        }
      ]) => !Object.prototype.hasOwnProperty.call(era.toHuman(), 'NativeAssetId')
    )
    .map(
      ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals } = value.toHuman() as any
        return {
          assetId: Object.values(era.toHuman() ?? {})[0],
          symbol,
          decimals: +decimals
        }
      }
    )
}

const fetchOtherAssetsType2 = async (api: ApiPromise, query: string) => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()
  return res.map(
    ([
      {
        args: [era]
      },
      value
    ]) => {
      const json = (value.toHuman() as any).metadata
      return {
        assetId: era.toString(),
        symbol: json.symbol,
        decimals: +json.decimals
      }
    }
  )
}

const fetchAssetsType2 = async (api: ApiPromise, query: string): Promise<Partial<TNodeAssets>> => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()

  const nativeAssets = res
    .filter(
      ([
        {
          args: [era]
        }
      ]) => Object.prototype.hasOwnProperty.call(era.toHuman(), 'NativeAssetId')
    )
    .map(([, value]) => {
      const { symbol, decimals } = value.toHuman() as any
      return { symbol, decimals: +decimals }
    })

  const otherAssets = res
    .filter(
      ([
        {
          args: [era]
        }
      ]) => !Object.prototype.hasOwnProperty.call(era.toHuman(), 'NativeAssetId')
    )
    .map(
      ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals } = value.toHuman() as any
        return {
          assetId: Object.values(era.toHuman() ?? {})[0],
          symbol,
          decimals: +decimals
        }
      }
    )

  return { nativeAssets, otherAssets }
}

const removePrefix = (inputString: string, prefix: string) => {
  if (inputString.startsWith(prefix)) {
    return inputString.substring(prefix.length)
  }
  return inputString
}

const transformOtherAssets = (otherAssets: any, node: TNode) => {
  return node === 'Moonbeam' || node === 'Moonriver'
    ? otherAssets.map((asset: any) => ({ ...asset, symbol: removePrefix(asset.symbol, 'xc') }))
    : otherAssets
}

const fetchNodeAssets = async (
  node: TNode,
  api: ApiPromise,
  query: string | null
): Promise<Partial<TNodeAssets>> => {
  // Different format of data
  if (node === 'Acala' || node === 'Karura') {
    const assets = await fetchAssetsType2(api, query!)
    await api.disconnect()
    return assets
  }

  // Different format of data
  if (node === 'Centrifuge') {
    const nativeAssets = (await fetchNativeAssets(api)) ?? []
    const otherAssets = query ? await fetchOtherAssetsCentrifuge(api, query) : []
    await api.disconnect()
    return {
      nativeAssets,
      otherAssets
    }
  }

  if (node === 'BifrostPolkadot') {
    const nativeAssets = (await fetchBifrostNativeAssets(api)) ?? []
    await api.disconnect()
    return {
      nativeAssets,
      otherAssets: []
    }
  }

  const nativeAssets = (await fetchNativeAssets(api)) ?? []

  const fetcher = node === 'Kico' ? fetchOtherAssetsType2 : fetchOtherAssets
  const otherAssets = query ? await fetcher(api, query) : []

  await api.disconnect()

  return {
    nativeAssets,
    otherAssets: transformOtherAssets(otherAssets, node)
  }
}

const fetchAllNodesAssets = async (assetMap: NodeToAssetModuleMap, assetsMapJson: any) => {
  const output: TAssetJsonMap = JSON.parse(JSON.stringify(assetsMapJson))
  for (const [node, query] of Object.entries(assetMap)) {
    const nodeName = node as TNode
    console.log(`Fetching assets for ${nodeName}...`)

    const newData = await fetchTryMultipleProvidersWithTimeout(nodeName, api =>
      fetchNodeAssets(nodeName, api, query)
    )

    const isError = newData === null
    const oldData = Object.prototype.hasOwnProperty.call(output, nodeName) ? output[nodeName] : null

    const paraId = getNodeEndpointOption(nodeName)?.paraId
    if (!paraId) {
      throw new Error(`Cannot find paraId for node ${nodeName}`)
    }

    // In case we cannot fetch assets for some node. Keep existing data
    output[nodeName] = {
      paraId,
      relayChainAssetSymbol: getNode(nodeName).type === 'polkadot' ? 'DOT' : 'KSM',
      nativeAssets: isError && oldData ? oldData.nativeAssets : newData?.nativeAssets ?? [],
      otherAssets: isError && oldData ? oldData.otherAssets : newData?.otherAssets ?? []
    }
  }
  return output
}

const searchDecimalsBySymbol = (symbol: string, data: TAssetJsonMap) => {
  for (const node of NODE_NAMES) {
    if (node === 'BifrostPolkadot') {
      continue
    }
    const { nativeAssets, otherAssets } = data[node]
    const decimals = [...nativeAssets, ...otherAssets].find(
      asset => asset.symbol === symbol
    )?.decimals
    if (decimals) {
      return decimals
    }
  }
}

const fillInDecimalsForBifrostPolkadot = (data: TAssetJsonMap) => {
  data.BifrostPolkadot = {
    ...data.BifrostPolkadot,
    nativeAssets: data.BifrostPolkadot.nativeAssets.map(asset => {
      const decimals = asset.symbol === 'ASG' ? 18 : searchDecimalsBySymbol(asset.symbol, data)
      if (!decimals) {
        throw new Error(`Cannot find decimals for Bitfrost polkadot asset ${asset.symbol}`)
      }
      return {
        ...asset,
        decimals
      }
    })
  }
  return data
}

;(async () => {
  checkForNodeJsEnvironment()
  const JSON_FILE_PATH = './src/maps/assets.json'
  const assetsJson = await readJsonOrReturnEmptyObject(JSON_FILE_PATH)
  const data = await fetchAllNodesAssets(nodeToQuery, assetsJson)
  const transformedData = fillInDecimalsForBifrostPolkadot(data)
  writeJsonSync(JSON_FILE_PATH, transformedData)
  console.log('Successfuly fetched all assets')
  process.exit()
})()
