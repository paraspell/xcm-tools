import type { TRelaychain, TSubstrateChain } from '@paraspell/sdk-common'

import { getRelayChainOf } from './getRelayChainOf'

const RELAY_CHAIN_SYMBOL_MAP: Record<TRelaychain, string> = {
  Polkadot: 'DOT',
  Kusama: 'KSM',
  Westend: 'WND',
  Paseo: 'PAS'
}

/**
 * Gets the native asset symbol of the relay chain that the given chain belongs to.
 *
 * @param chain - The chain to evaluate.
 * @returns The native asset symbol of the corresponding relay chain.
 */
export const getRelayChainSymbolOf = (chain: TSubstrateChain): string =>
  RELAY_CHAIN_SYMBOL_MAP[getRelayChainOf(chain)]
