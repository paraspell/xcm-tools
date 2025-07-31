/**
 * Supported nodes excluding relay chains and Ethereum.
 */
export const NODE_NAMES_DOT_KSM = [
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
 * Supported nodes including Ethereum.
 */
export const NODE_NAMES = [...NODE_NAMES_DOT_KSM, 'Ethereum'] as const

/**
 * Relay chains.
 */
export const RELAY_CHAINS = ['Polkadot', 'Kusama', 'Westend', 'Paseo'] as const

/**
 * Supported nodes including relay chains and Ethereum.
 */
export const NODES_WITH_RELAY_CHAINS = [...NODE_NAMES, ...RELAY_CHAINS] as const

/**
 * Supported nodes including relay chains and excluding Ethereum.
 */
export const NODES_WITH_RELAY_CHAINS_DOT_KSM = [...NODE_NAMES_DOT_KSM, ...RELAY_CHAINS] as const
