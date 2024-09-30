import { TNodePolkadotKusama } from '../../src/types'

export const nodeToQuery: Record<TNodePolkadotKusama, string | null> = {
  // Chain state query: <module>.<section> for assets metadata
  Acala: 'assetRegistry.assetMetadatas',
  Astar: 'assets.metadata',
  BifrostPolkadot: null, // Has no foreign assets. Native assets are fetched directly from state.getMetadata()
  Bitgreen: null, // No assets metadata query
  Centrifuge: 'ormlAssetRegistry.metadata',
  ComposableFinance: 'assetsRegistry.assetSymbol',
  Darwinia: 'assets.metadata',
  Hydration: 'assetRegistry.assets',
  Interlay: 'assetRegistry.metadata',
  Litentry: null, // Assets query returns empty array
  Moonbeam: 'assets.metadata',
  Parallel: 'assets.metadata',
  AssetHubPolkadot: 'assets.metadata',
  Altair: 'ormlAssetRegistry.metadata',
  Amplitude: 'assetRegistry.metadata',
  Bajun: 'assets.metadata',
  Basilisk: 'assetRegistry.assetMetadataMap',
  BifrostKusama: null, // Has no foreign assets created yet
  Calamari: 'assets.metadata',
  Crab: 'assets.metadata',
  CrustShadow: 'assets.metadata',
  Encointer: null, // No assets metadata query
  Imbue: null, // Assets query returns empty array
  Integritee: null, // Assets query returns empty array
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
  Unique: null, // Foreign assets have no symbol or decimals
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
  CoretimePolkadot: null,
  Subsocial: null, // No assets metadata query
  KiltSpiritnet: null, // No assets metadata query
  Curio: 'assetRegistry.metadata',
  BridgeHubPolkadot: null,
  BridgeHubKusama: null,
  Mythos: null, // No assets metadata query
  Peaq: 'assets.metadata',
  Polimec: 'foreignAssets.metadata'
}
