import type { TNode } from '../../src/types'

export const GLOBAL = 'GLOBAL_XCM_REGISTRY'

export const nodeToQuery: Record<TNode, string | null> = {
  // Chain state query: <module>.<section> for assets metadata
  // Or GLOBAL flag to use global XCM registry
  Acala: GLOBAL,
  Astar: GLOBAL,
  BifrostPolkadot: GLOBAL,
  Bitgreen: null, // No assets metadata query
  Centrifuge: GLOBAL,
  ComposableFinance: 'assetsRegistry.assetSymbol',
  Darwinia: GLOBAL,
  Hydration: GLOBAL,
  Interlay: GLOBAL,
  Litentry: GLOBAL,
  Moonbeam: GLOBAL,
  Parallel: GLOBAL,
  AssetHubPolkadot: GLOBAL,
  Altair: GLOBAL,
  Amplitude: 'assetRegistry.metadata',
  Bajun: GLOBAL,
  Basilisk: GLOBAL,
  BifrostKusama: GLOBAL,
  Calamari: GLOBAL,
  Crab: 'assets.metadata',
  CrustShadow: 'assets.metadata',
  Encointer: null, // No assets metadata query
  Imbue: GLOBAL,
  InvArchTinker: null, // Assets query returns empty array
  Karura: GLOBAL,
  Kintsugi: GLOBAL,
  Moonriver: GLOBAL,
  ParallelHeiko: GLOBAL,
  Picasso: 'assetsRegistry.assetSymbol',
  Quartz: GLOBAL,
  RobonomicsKusama: GLOBAL,
  RobonomicsPolkadot: 'assets.metadata',
  PeopleKusama: null, // Does not support ParaToPara transfers
  PeoplePolkadot: null, // Does not support ParaToPara transfers
  Shiden: GLOBAL,
  AssetHubKusama: GLOBAL,
  Turing: GLOBAL,
  Unique: GLOBAL,
  Crust: 'assets.metadata',
  Manta: 'assets.metadata',
  Nodle: GLOBAL,
  NeuroWeb: 'assets.metadata',
  Pendulum: GLOBAL,
  Zeitgeist: 'assetRegistry.metadata',
  Collectives: null,
  Phala: GLOBAL,
  Khala: GLOBAL,
  CoretimeKusama: null,
  CoretimePolkadot: null,
  Subsocial: null, // No assets metadata query
  KiltSpiritnet: null, // No assets metadata query
  Curio: 'assetRegistry.metadata',
  BridgeHubPolkadot: null,
  BridgeHubKusama: null,
  Mythos: null, // No assets metadata query
  Peaq: 'assets.metadata',
  Polimec: 'foreignAssets.metadata',
  Ethereum: null
}
