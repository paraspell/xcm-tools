/**
 * Supported Polkadot / Kusama / Westend / Paseo parachains.
 */
export const PARACHAINS = [
  // Polkadot chains
  'AssetHubPolkadot',
  'Acala',
  'Ajuna',
  'Astar',
  'BifrostPolkadot',
  'BridgeHubPolkadot',
  'Centrifuge',
  'ComposableFinance',
  'Darwinia',
  'EnergyWebX',
  'Hydration',
  'IntegriteePolkadot',
  'Interlay',
  'Heima',
  'Jamton',
  'Moonbeam',
  'CoretimePolkadot',
  'Collectives',
  'Crust',
  'Manta',
  'Nodle',
  'NeuroWeb',
  'Pendulum',
  'Phala',
  'Subsocial',
  'KiltSpiritnet',
  'Curio',
  'Mythos',
  'Peaq',
  'Polimec',
  'RobonomicsPolkadot',
  'PeoplePolkadot',
  'Unique',
  'Xode',
  // Kusama chains
  'AssetHubKusama',
  'BridgeHubKusama',
  'IntegriteeKusama',
  'Karura',
  'Kintsugi',
  'Moonriver',
  'CoretimeKusama',
  'Encointer',
  'Altair',
  'Amplitude',
  'Basilisk',
  'BifrostKusama',
  'CrustShadow',
  'Crab',
  'Laos',
  'Quartz',
  'RobonomicsKusama',
  'PeopleKusama',
  'Shiden',
  'Zeitgeist',
  // Westend testnet chains
  'AssetHubWestend',
  'BridgeHubWestend',
  'CollectivesWestend',
  'CoretimeWestend',
  'Penpal',
  'PeopleWestend',
  // Paseo testnet chains
  'AjunaPaseo',
  'AssetHubPaseo',
  'BifrostPaseo',
  'BridgeHubPaseo',
  'CoretimePaseo',
  'EnergyWebXPaseo',
  'HeimaPaseo',
  'HydrationPaseo',
  'IntegriteePaseo',
  'KiltPaseo',
  'LaosPaseo',
  'NeuroWebPaseo',
  'NodlePaseo',
  'PAssetHub',
  'PeoplePaseo',
  'ZeitgeistPaseo'
] as const

/**
 * Relaychains.
 */
export const RELAYCHAINS = ['Polkadot', 'Kusama', 'Westend', 'Paseo'] as const

/**
 * All Substrate chains (parachains + relaychains).
 */
export const SUBSTRATE_CHAINS = [...PARACHAINS, ...RELAYCHAINS] as const

/**
 * External chains (non-Substrate/Polkadot ecosystem chains).
 */
export const EXTERNAL_CHAINS = ['Ethereum'] as const

/**
 * All supported chains.
 */
export const CHAINS = [...PARACHAINS, ...RELAYCHAINS, ...EXTERNAL_CHAINS] as const
