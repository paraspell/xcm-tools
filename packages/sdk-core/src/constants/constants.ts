import {
  Parents,
  type TJunction,
  type TMultiLocation,
  type TNodeWithRelayChains
} from '@paraspell/sdk-common'

export const DEFAULT_FEE_ASSET = 0

export const ETH_PARA_ID = 1
export const ETH_CHAIN_ID = BigInt(ETH_PARA_ID)
export const ETHEREUM_JUNCTION: TJunction = {
  GlobalConsensus: { Ethereum: { chainId: ETH_CHAIN_ID } }
}

export const DOT_MULTILOCATION: TMultiLocation = {
  parents: Parents.ONE,
  interior: 'Here'
}

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

export const SYSTEM_NODES_POLKADOT: TNodeWithRelayChains[] = [
  'PeoplePolkadot',
  'CoretimePolkadot',
  'Collectives'
]

export const SYSTEM_NODES_KUSAMA: TNodeWithRelayChains[] = ['PeopleKusama', 'CoretimeKusama']
