import { TNodeWithRelayChains } from '@paraspell/sdk-common'

export const GLOBAL = 'GLOBAL_XCM_REGISTRY'

export const nodeToQuery: Record<TNodeWithRelayChains, string[]> = {
  // Chain state query: <module>.<section> for assets metadata
  // Or GLOBAL flag to use global XCM registry
  Polkadot: [GLOBAL],
  Kusama: [GLOBAL],
  Acala: [GLOBAL, 'assetRegistry.assetMetadatas'],
  Astar: [GLOBAL, 'assets.metadata'],
  BifrostPolkadot: [GLOBAL, 'assetRegistry.currencyMetadatas'],
  Bitgreen: [], // No assets metadata query
  Centrifuge: [GLOBAL, 'ormlAssetRegistry.metadata'],
  ComposableFinance: ['assetsRegistry.assetSymbol'],
  Darwinia: [GLOBAL, 'assets.metadata'],
  Hydration: [GLOBAL, 'assetRegistry.assets'],
  Interlay: [GLOBAL, 'assetRegistry.metadata'],
  Heima: ['assets.metadata'],
  Moonbeam: ['assetManager.assetIdType'],
  AssetHubPolkadot: [GLOBAL, 'assets.metadata'],
  Altair: [GLOBAL, 'ormlAssetRegistry.metadata'],
  Amplitude: ['assetRegistry.metadata'],
  Basilisk: [GLOBAL, 'assetRegistry.assetMetadataMap'],
  BifrostKusama: [GLOBAL, 'assetRegistry.currencyMetadatas'],
  Calamari: [GLOBAL, 'assets.metadata'],
  Crab: ['assets.metadata'],
  CrustShadow: ['assets.metadata'],
  Encointer: [], // No assets metadata query
  InvArchTinker: [], // Assets query returns empty array
  Karura: [GLOBAL, 'assetRegistry.assetMetadatas'],
  Kintsugi: [GLOBAL, 'assetRegistry.metadata'],
  Moonriver: ['assetManager.assetIdType'],
  Quartz: ['foreignAssets.collectionToForeignAsset'],
  RobonomicsKusama: ['assets.metadata'],
  RobonomicsPolkadot: ['assets.metadata'],
  PeopleKusama: [], // Does not support ParaToPara transfers
  PeoplePolkadot: [], // Does not support ParaToPara transfers
  Shiden: [GLOBAL, 'assets.metadata'],
  AssetHubKusama: [GLOBAL, 'assets.metadata'],
  Turing: [GLOBAL, 'assetRegistry.metadata'],
  Unique: ['foreignAssets.collectionToForeignAsset'],
  Crust: ['assets.metadata'],
  Manta: ['assets.metadata'],
  Nodle: [],
  NeuroWeb: ['assets.metadata'],
  Pendulum: [GLOBAL, 'assetRegistry.metadata'],
  Zeitgeist: ['assetRegistry.metadata'],
  Collectives: [],
  Phala: [GLOBAL, 'assets.metadata'],
  CoretimeKusama: [],
  CoretimePolkadot: [],
  Subsocial: [], // No assets metadata query
  KiltSpiritnet: [], // No assets metadata query
  Curio: ['assetRegistry.metadata'],
  BridgeHubPolkadot: [],
  BridgeHubKusama: [],
  Mythos: [], // No assets metadata query
  Peaq: ['assets.metadata'],
  Polimec: ['foreignAssets.metadata'],
  Ethereum: []
}
