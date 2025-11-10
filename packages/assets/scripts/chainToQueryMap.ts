import { TSubstrateChain } from '@paraspell/sdk-common'

export const chainToQuery: Record<TSubstrateChain, string[]> = {
  // Chain state query: <module>.<method> for assets metadata

  // Relay chains
  Kusama: [],
  Paseo: [],
  Polkadot: [],
  Westend: [],

  // Parachains
  Acala: ['assetRegistry.assetMetadatas'],
  Ajuna: ['assets.metadata'],
  AjunaPaseo: ['assets.metadata'],
  Altair: ['ormlAssetRegistry.metadata'],
  Amplitude: ['assetRegistry.metadata'],
  Astar: ['assets.metadata'],
  AssetHubKusama: ['assets.metadata'],
  AssetHubPaseo: ['assets.metadata'],
  AssetHubPolkadot: ['assets.metadata'],
  AssetHubWestend: ['assets.metadata'],
  Basilisk: ['assetRegistry.assetMetadataMap'],
  BifrostKusama: ['assetRegistry.currencyMetadatas'],
  BifrostPaseo: ['assetRegistry.currencyMetadatas'],
  BifrostPolkadot: ['assetRegistry.currencyMetadatas'],
  BridgeHubKusama: [], // No assets metadata query
  BridgeHubPaseo: [], // No assets metadata query
  BridgeHubPolkadot: [], // No assets metadata query
  BridgeHubWestend: [], // No assets metadata query
  Centrifuge: ['ormlAssetRegistry.metadata'],
  Collectives: [],
  CollectivesWestend: [],
  CoretimeKusama: [], // No assets metadata query
  CoretimePaseo: [], // No assets metadata query
  CoretimePolkadot: [], // No assets metadata query
  CoretimeWestend: [], // No assets metadata query
  Crab: ['assets.metadata'],
  Crust: ['assets.metadata'],
  CrustShadow: ['assets.metadata'],
  Curio: ['assetRegistry.metadata'],
  Darwinia: ['assets.metadata'],
  Encointer: [], // No assets metadata query
  EnergyWebX: ['assets.metadata'],
  EnergyWebXPaseo: ['assets.metadata'],
  Heima: ['assets.metadata'],
  HeimaPaseo: ['assets.metadata'],
  Hydration: ['assetRegistry.assets'],
  HydrationPaseo: ['assetRegistry.assets'],
  IntegriteeKusama: ['assets.metadata'],
  IntegriteePaseo: ['assets.metadata'],
  IntegriteePolkadot: ['assets.metadata'],
  Interlay: ['assetRegistry.metadata'],
  Jamton: ['assetRegistry.metadata'],
  Karura: ['assetRegistry.assetMetadatas'],
  KiltPaseo: ['fungibles.metadata'],
  KiltSpiritnet: ['fungibles.metadata'],
  Kintsugi: ['assetRegistry.metadata'],
  Laos: [], // No assets metadata query
  LaosPaseo: [], // No assets metadata query
  Manta: ['assets.metadata'],
  Moonbeam: ['evmForeignAssets.assetsById'],
  Moonriver: ['evmForeignAssets.assetsById'],
  Mythos: [], // No assets metadata query
  NeuroWeb: ['assets.metadata'],
  NeuroWebPaseo: ['assets.metadata'],
  Nodle: [],
  NodlePaseo: [],
  PAssetHub: ['assets.metadata'],
  Peaq: ['assets.metadata'],
  Pendulum: ['assetRegistry.metadata'],
  Penpal: ['foreignAssets.metadata'],
  PeopleKusama: [], // No assets metadata query
  PeoplePaseo: [], // No assets metadata query
  PeoplePolkadot: [], // No assets metadata query
  PeopleWestend: [], // No assets metadata query
  Phala: ['assets.metadata'],
  Quartz: ['foreignAssets.collectionToForeignAsset'],
  RobonomicsKusama: ['assets.metadata'],
  RobonomicsPolkadot: ['assets.metadata'],
  Shiden: ['assets.metadata'],
  Unique: ['foreignAssets.collectionToForeignAsset'],
  Xode: ['assets.metadata'],
  Zeitgeist: ['assetRegistry.metadata'],
  ZeitgeistPaseo: ['assetRegistry.metadata']
}
