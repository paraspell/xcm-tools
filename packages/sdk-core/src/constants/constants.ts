import type { TNodeWithRelayChains } from '@paraspell/sdk-common'
import { Parents, type TJunction, type TMultiLocation } from '@paraspell/sdk-common'

import type { TWeight } from '../types'

export const DEFAULT_FEE_ASSET = 0

export const ETH_PARA_ID = 1
export const ETH_CHAIN_ID = BigInt(ETH_PARA_ID)
export const ETHEREUM_JUNCTION: TJunction = {
  GlobalConsensus: { Ethereum: { chainId: ETH_CHAIN_ID } }
}

export const DEFAULT_FEE = 'Unlimited'

export const DOT_MULTILOCATION: TMultiLocation = {
  parents: Parents.ONE,
  interior: 'Here'
}

export const CHAINS_DOT_RESERVE_AH = new Set<TNodeWithRelayChains>([
  'Polimec',
  'Moonbeam',
  'BifrostPolkadot',
  'PeoplePolkadot',
  'Ajuna'
] as const)

export const ASSET_HUB_EXECUTION_FEE = 2200000000n // 0.22 DOT

export const FEE_PADDING_FACTOR = 130n // 30% padding

export const TX_CLIENT_TIMEOUT_MS = 20 * 60 * 1000 // 20 minutes
export const DRY_RUN_CLIENT_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export const MAX_U64 = (1n << 64n) - 1n

export const MAX_WEIGHT: TWeight = { proofSize: MAX_U64, refTime: MAX_U64 }
