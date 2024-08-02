import { TNodePolkadotKusama } from '../../src/types'

export const nodeToQuery: Record<TNodePolkadotKusama, string | null> = {
  // Chain state query: <module>.<section> for assets metadata
  Acala: 'assetRegistry.assetMetadatas',
  Astar: 'assets.metadata',
  BifrostPolkadot: null, // Has no foreign assets. Native assets are fetched directly from state.getMetadata()
  Bitgreen: null, // No assets metadata query
  Centrifuge: 'ormlAssetRegistry.metadata',
  ComposableFinance: 'assetsRegistry.assetSymbol',
  Darwinia: null, // No assets metadata query
  Hydration: 'assetRegistry.assets',
  Interlay: 'assetRegistry.metadata',
  Litentry: null, // Assets query returns empty array
  Moonbeam: 'assets.metadata',
  Parallel: 'assets.metadata',
  AssetHubPolkadot: 'assets.metadata',
  Altair: null, // Assets query returns empty array
  Amplitude: null, // No assets metadata query
  Bajun: 'assets.metadata',
  Basilisk: 'assetRegistry.assetMetadataMap',
  BifrostKusama: null, // Has no foreign assets created yet
  Calamari: 'assets.metadata',
  Crab: null, // No assets metadata query
  CrustShadow: 'assets.metadata',
  Encointer: null, // No assets metadata query
  Imbue: null, // Assets query returns empty array
  Integritee: null, // No assets metadata query
  InvArchTinker: null, // Assets query returns empty array
  Karura: 'assetRegistry.assetMetadatas',
  Kintsugi: 'assetRegistry.metadata',
  Litmus: null, // Assets query returns empty array
  Moonriver: 'assets.metadata',
  ParallelHeiko: 'assets.metadata',
  Picasso: 'assetsRegistry.assetSymbol',
  Pioneer: 'assetManager.assetMetadatas',
  Quartz: null, // No assets metadata query
  Robonomics: 'assets.metadata',
  Shiden: 'assets.metadata',
  AssetHubKusama: 'assets.metadata',
  Turing: 'assetRegistry.metadata',
  Unique: null, // Foreign assets query returns empty array
  Crust: 'assets.metadata',
  Manta: 'assets.metadata',
  Nodle: null, // Only NODL paraToPara for now
  NeuroWeb: 'assets.metadata',
  Pendulum: '', // Only PEN paraToPara for now
  Polkadex: 'assets.asset',
  Zeitgeist: 'assetRegistry.metadata',
  Collectives: null,
  Phala: 'assets.metadata',
  Khala: 'assets.metadata',
  CoretimeKusama: null,
  Subsocial: null,
  KiltSpiritnet: null,
  Curio: 'assetRegistry.metadata',
  BridgeHubPolkadot: null,
  BridgeHubKusama: null,
  Mythos: null,
  Peaq: 'assets.metadata'
}
