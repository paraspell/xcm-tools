import { isRelayChain, type TRelaychain, type TSubstrateChain } from '@paraspell/sdk-common'

import { getChain } from '../getChain'

/**
 * Gets the relay chain (Polkadot, Kusama, Westend, or Paseo) of a given chain.
 *
 * @param chain - The chain to evaluate.
 * @returns The corresponding relay chain.
 */
export const getRelayChainOf = (chain: TSubstrateChain): TRelaychain => {
  if (isRelayChain(chain)) return chain
  return getChain(chain).ecosystem
}
