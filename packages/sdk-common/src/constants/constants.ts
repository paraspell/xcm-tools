/**
 * Supported nodes excluding relay chains and Ethereum.
 */
export const NODE_NAMES_DOT_KSM = [
  'AssetHubPolkadot',
  'Acala',
  'Astar',
  'BifrostPolkadot',
  'Bitgreen',
  'BridgeHubPolkadot',
  'BridgeHubKusama',
  'Centrifuge',
  'ComposableFinance',
  'Darwinia',
  'Hydration',
  'Interlay',
  'Heima',
  'Moonbeam',
  'AssetHubKusama',
  'CoretimeKusama',
  'CoretimePolkadot',
  'Encointer',
  'Altair',
  'Amplitude',
  'Basilisk',
  'BifrostKusama',
  'Calamari',
  'CrustShadow',
  'Crab',
  'InvArchTinker',
  'Karura',
  'Kintsugi',
  'Moonriver',
  'Quartz',
  'RobonomicsKusama',
  'RobonomicsPolkadot',
  'PeoplePolkadot',
  'PeopleKusama',
  'Shiden',
  'Turing',
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
  'Polimec'
] as const

/**
 * Supported nodes including Ethereum.
 */
export const NODE_NAMES = [...NODE_NAMES_DOT_KSM, 'Ethereum'] as const

/**
 * Supported nodes including relay chains and Ethereum.
 */
export const NODES_WITH_RELAY_CHAINS = [...NODE_NAMES, 'Polkadot', 'Kusama'] as const

/**
 * Supported nodes including relay chains and excluding Ethereum.
 */
export const NODES_WITH_RELAY_CHAINS_DOT_KSM = [
  ...NODE_NAMES_DOT_KSM,
  'Polkadot',
  'Kusama'
] as const
