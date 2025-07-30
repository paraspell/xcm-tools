/**
 * Supported Polkadot / Kusama / Westend / Paseo parachains.
 */
export const PARACHAINS = [
  'AssetHubPolkadot',
  'Acala',
  'Ajuna',
  'Astar',
  'BifrostPolkadot',
  'BridgeHubPolkadot',
  'BridgeHubKusama',
  'Centrifuge',
  'ComposableFinance',
  'Darwinia',
  'EnergyWebX',
  'EnergyWebXPaseo',
  'Hydration',
  'IntegriteeKusama',
  'IntegriteePaseo',
  'Interlay',
  'Heima',
  'Jamton',
  'Moonbeam',
  'AssetHubKusama',
  'CoretimeKusama',
  'CoretimePolkadot',
  'Encointer',
  'Altair',
  'Amplitude',
  'Basilisk',
  'BifrostKusama',
  'CrustShadow',
  'Crab',
  'Karura',
  'Kintsugi',
  'Moonriver',
  'Laos',
  'Quartz',
  'RobonomicsKusama',
  'RobonomicsPolkadot',
  'PeoplePolkadot',
  'PeopleKusama',
  'Shiden',
  'Unique',
  'Crust',
  'Manta',
  'Nodle',
  'NeuroWeb',
  'Pendulum',
  'Zeitgeist',
  'Collectives',
  'Phala',
  'Subsocial',
  'KiltSpiritnet',
  'Curio',
  'Mythos',
  'Peaq',
  'Polimec',
  // Westend testnet chains
  'AssetHubWestend',
  'BridgeHubWestend',
  'CollectivesWestend',
  'CoretimeWestend',
  'PeopleWestend',
  'Penpal',
  // Paseo testnet chains
  'AssetHubPaseo',
  'BridgeHubPaseo',
  'CoretimePaseo',
  'PAssetHub',
  'PeoplePaseo',
  'AjunaPaseo',
  'BifrostPaseo',
  'HeimaPaseo',
  'HydrationPaseo',
  'KiltPaseo',
  'LaosPaseo',
  'NeuroWebPaseo',
  'NodlePaseo',
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
