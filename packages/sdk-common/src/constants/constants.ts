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
  'Darwinia',
  'EnergyWebX',
  'Hydration',
  'Heima',
  'Jamton',
  'CoretimePolkadot',
  'Collectives',
  'Crust',
  'NeuroWeb',
  'Pendulum',
  'Mythos',
  'Peaq',
  'PeoplePolkadot',
  'Unique',
  'Xode',
  // Kusama chains
  'AssetHubKusama',
  'BridgeHubKusama',
  'Karura',
  'CoretimeKusama',
  'Encointer',
  'Basilisk',
  'BifrostKusama',
  'CrustShadow',
  'Crab',
  'RobonomicsPolkadot',
  'PeopleKusama',
  'Shiden',
  // Westend testnet chains
  'AssetHubWestend',
  'BridgeHubWestend',
  'CollectivesWestend',
  'CoretimeWestend',
  'Penpal',
  'PeopleWestend',
  // Paseo testnet chains
  'AssetHubPaseo',
  'EnergyWebXPaseo',
  'HeimaPaseo',
  'HydrationPaseo',
  'NeuroWebPaseo',
  'PeoplePaseo'
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
export const EXTERNAL_CHAINS = ['Ethereum', 'EthereumTestnet'] as const

/**
 * Default SS58 address prefix.
 */
export const DEFAULT_SS58_PREFIX = 42

/**
 * All supported chains.
 */
export const CHAINS = [...PARACHAINS, ...RELAYCHAINS, ...EXTERNAL_CHAINS] as const
