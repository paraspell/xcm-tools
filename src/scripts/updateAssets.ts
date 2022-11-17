import { ApiPromise, WsProvider } from '@polkadot/api'
import { TAssetJsonMap, TNode, TNodeAssets } from '../types'
import { getNodeDetails, getNodeEndpointOption } from '../utils'

const ASSETS_MAP_JSON_PATH = './src/maps/assets.json'

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
  Efinity: null, // Assets query returns empty array
  Equilibrium: null, // Has eqAssets state query but there are only ids, no symbols
  HydraDX: null, // Assets query returns empty array
  Interlay: 'assetRegistry.metadata',
  Kilt: null, // No assets metadata query
  Kapex: null, // No assets metadata query
  Kylin: 'assets.metadata',
  Litentry: null, // Assets query returns empty array
  Moonbeam: 'assets.metadata',
  OriginTrail: 'assets.metadata',
  Parallel: 'assets.metadata',
  Phala: 'assets.metadata',
  Statemint: 'assets.metadata',
  Unique: null, // No assets metadata query
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
  GM: null, // No assets metadata query
  Imbue: null, // Assets query returns empty array
  Integritee: null, // No assets metadata query
  InvArchTinker: null, // Assets query returns empty array
  Kico: 'currencies.dicoAssetsInfo',
  Kabocha: null, // No assets metadata query
  Karura: 'assetRegistry.assetMetadatas',
  Khala: 'assets.metadata',
  Kintsugi: 'assetRegistry.metadata',
  Listen: 'currencies.listenAssetsInfo',
  Litmus: null, // Assets query returns empty array
  Mangata: 'assetRegistry.metadata',
  Moonriver: 'assets.metadata',
  ParallelHeiko: 'assets.metadata',
  Picasso: null, // Assets query returns empty array
  Pichiu: 'assets.metadata',
  Pioneer: null, // Assets query returns empty array
  Quartz: null, // No assets metadata query
  Robonomics: 'assets.metadata',
  Sora: null, // No assets metadata query
  Shiden: 'assets.metadata',
  Snow: 'assets.metadata',
  Statemine: 'assets.metadata',
  SubsocialX: null, // No assets metadata query
  DataHighway: 'assets.metadata',
  Turing: 'assetRegistry.metadata',
  Zeitgeist: null // No assets metadata query
}

const fetchNativeAssets = async (api: ApiPromise) => {
  const propertiesRes = await api.rpc.system.properties()
  return propertiesRes.toHuman().tokenSymbol as string[]
}

const fetchBifrostNativeAssets = async (api: ApiPromise): Promise<string[]> => {
  const res = await api.rpc.state.getMetadata()
  const TYPE_ID = 114
  return res.asLatest.lookup.types.at(TYPE_ID).type.def.asVariant.variants.map(k => k.name.toHuman())
}

const fetchOtherAssets = async (api: ApiPromise, query: string) => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()
  return res.map(([{ args: [era] }, value]) => ({
    assetId: era.toString(),
    symbol: (value.toHuman() as any).symbol
  }))
}

const fetchOtherAssetsCentrifuge = async (api: ApiPromise, query: string) => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()
  return res.filter(([{ args: [era] }]) => !Object.prototype.hasOwnProperty.call(era.toHuman(), 'NativeAssetId'))
    .map(([{ args: [era] }, value]) => ({
      assetId: Object.values(era.toHuman())[0], symbol: (value.toHuman() as any).symbol
    }))
}

const fetchOtherAssetsType2 = async (api: ApiPromise, query: string) => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()
  return res.map(([{ args: [era] }, value]) => ({
    assetId: era.toString(),
    symbol: (value.toHuman() as any).metadata.symbol
  }))
}

const fetchAssetsType2 = async (api: ApiPromise, query: string): Promise<Partial<TNodeAssets>> => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()

  const nativeAssets = res
    .filter(([{ args: [era] }]) => Object.prototype.hasOwnProperty.call(era.toHuman(), 'NativeAssetId'))
    .map(([, value]) => (value.toHuman() as any).symbol)

  const otherAssets = res
    .filter(([{ args: [era] }]) => !Object.prototype.hasOwnProperty.call(era.toHuman(), 'NativeAssetId'))
    .map(([{ args: [era] }, value]) => ({
      assetId: Object.values(era.toHuman())[0], symbol: (value.toHuman() as any).symbol
    }))

  return { nativeAssets, otherAssets }
}

const fetchNodeAssets = async (node: TNode, api: ApiPromise, query: string): Promise<Partial<TNodeAssets>> => {
  // Different format of data
  if (node === 'Acala' || node === 'Karura') {
    const assets = await fetchAssetsType2(api, query)
    await api.disconnect()
    return assets
  }

  // Different format of data
  if (node === 'Centrifuge') {
    const nativeAssets = await fetchNativeAssets(api) ?? []
    const otherAssets = query ? await fetchOtherAssetsCentrifuge(api, query) : []
    await api.disconnect()
    return {
      nativeAssets,
      otherAssets
    }
  }

  if (node === 'BifrostPolkadot') {
    const nativeAssets = await fetchBifrostNativeAssets(api) ?? []
    await api.disconnect()
    return {
      nativeAssets,
      otherAssets: []
    }
  }

  const nativeAssets = await fetchNativeAssets(api) ?? []

  const fetcher = node === 'Kico' || node === 'Listen' ? fetchOtherAssetsType2 : fetchOtherAssets
  const otherAssets = query ? await fetcher(api, query) : []

  await api.disconnect()

  return {
    nativeAssets,
    otherAssets
  }
}

const TIMEOUT_MS = 60000

const fetchNodeAssetsWithTimeout = (node: TNode, wsUrl: string, query: string): Promise<Partial<TNodeAssets>> => {
  return new Promise((resolve, reject) => {
    const wsProvider = new WsProvider(wsUrl)

    setTimeout(() => {
      wsProvider.disconnect()
      reject(new Error('Timed out'))
    }, TIMEOUT_MS)

    ApiPromise
      .create({ provider: wsProvider })
      .then(api => fetchNodeAssets(node, api, query))
      .then(resolve)
  })
}

const fetchNodeAssetsTryMultipleProviders = async (node: TNode, providers: string[], query: string): Promise<Partial<TNodeAssets> | null> => {
  for (const provider of providers) {
    try {
      console.log(`Trying ${provider}...`)
      return await fetchNodeAssetsWithTimeout(node, provider, query)
    } catch (e) {
      console.log(`Error fetching assets from ${provider}. Trying from another RPC endpoint`)
    }
  }
  console.error(`Assets for ${node} could not be fetched from any endpoint`)
  return null
}

const getNodeProviders = (node: TNode) => {
  const { providers } = getNodeEndpointOption(node)
  const providersArr = Object.values(providers)

  // TODO: Remove this when lib @polkadot/apps-config releases an update
  if (node === 'SubsocialX') { providersArr.unshift('wss://para.f3joule.space') } else if (node === 'Bitgreen') { providersArr.unshift('wss://mainnet.bitgreen.org') }

  return providersArr
}

const fetchAssets = (node: TNode, query: string): Promise<Partial<TNodeAssets> | null> => {
  const providers = getNodeProviders(node)
  return fetchNodeAssetsTryMultipleProviders(node, providers, query)
}

const fetchAllNodesAssets = async (assetMap: NodeToAssetModuleMap, assetsMapJson: any) => {
  const output: TAssetJsonMap = JSON.parse(JSON.stringify(assetsMapJson))
  for (const [node, query] of Object.entries(assetMap)) {
    const nodeName = node as TNode
    console.log(`Fetching assets for ${nodeName}...`)

    const newData = await fetchAssets(nodeName, query)
    const isError = newData === null
    const oldData = Object.prototype.hasOwnProperty.call(output, nodeName) ? output[nodeName] : null

    // In case we cannot fetch assets for some node. Keep existing data
    output[nodeName] = {
      relayChainAssetSymbol: getNodeDetails(nodeName).type === 'polkadot' ? 'DOT' : 'KSM',
      nativeAssets: isError && oldData ? oldData.nativeAssets : newData?.nativeAssets ?? [],
      otherAssets: isError && oldData ? oldData.otherAssets : newData?.otherAssets ?? []
    }
  }
  return output
}

const readAssetsJson = async () => {
  const { readFileSync } = await import('fs')
  try {
    return JSON.parse(readFileSync(ASSETS_MAP_JSON_PATH, 'utf8'))
  } catch (e) {
    return {}
  }
}

(async () => {
  if (typeof process !== 'object') { throw new TypeError('This script can only be executed in Node.JS environment') }
  const assetsJson = await readAssetsJson()
  const data = await fetchAllNodesAssets(nodeToQuery, assetsJson)
  const { writeFileSync } = await import('fs')
  writeFileSync(ASSETS_MAP_JSON_PATH, JSON.stringify(data, null, 4))
  console.log('Successfuly fetched all assets')
  process.exit()
})()
