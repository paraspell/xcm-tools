import { Parents, type TJunction, type TMultiLocation } from '../types'

export const DEFAULT_FEE_ASSET = 0

export const ETH_CHAIN_ID = BigInt(1)
export const ETHEREUM_JUNCTION: TJunction = {
  GlobalConsensus: { Ethereum: { chain_id: ETH_CHAIN_ID } }
}

export const DOT_MULTILOCATION: TMultiLocation = {
  parents: Parents.ONE,
  interior: 'Here'
}

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
  'Litentry',
  'Moonbeam',
  'Parallel',
  'AssetHubKusama',
  'CoretimeKusama',
  'CoretimePolkadot',
  'Encointer',
  'Altair',
  'Amplitude',
  'Bajun',
  'Basilisk',
  'BifrostKusama',
  'Calamari',
  'CrustShadow',
  'Crab',
  'Imbue',
  'InvArchTinker',
  'Karura',
  'Kintsugi',
  'Moonriver',
  'ParallelHeiko',
  'Picasso',
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
  'Khala',
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

/**
 * Supported XCM pallets.
 */
export const SUPPORTED_PALLETS = [
  'XTokens',
  'OrmlXTokens',
  'PolkadotXcm',
  'RelayerXcm',
  'XTransfer',
  'XcmPallet'
] as const
