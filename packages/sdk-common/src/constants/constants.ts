/**
 * Supported chains excluding relay chains and Ethereum.
 */
export const CHAIN_NAMES_DOT_KSM = [
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
  'Hydration',
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
 * Supported chains including Ethereum.
 */
export const CHAIN_NAMES = [...CHAIN_NAMES_DOT_KSM, 'Ethereum'] as const

/**
 * Relay chains.
 */
export const RELAY_CHAINS = ['Polkadot', 'Kusama', 'Westend', 'Paseo'] as const

/**
 * Supported chains including relay chains and Ethereum.
 */
export const CHAINS_WITH_RELAY_CHAINS = [...CHAIN_NAMES, ...RELAY_CHAINS] as const

/**
 * Supported chains including relay chains and excluding Ethereum.
 */
export const CHAINS_WITH_RELAY_CHAINS_DOT_KSM = [...CHAIN_NAMES_DOT_KSM, ...RELAY_CHAINS] as const
