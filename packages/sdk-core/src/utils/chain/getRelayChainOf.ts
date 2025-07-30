import type { TRelaychain, TSubstrateChain } from '@paraspell/sdk-common'

import { getChain } from '../getChain'

/**
 * Gets the relay chain (Polkadot, Kusama, Westend, or Paseo) of a given chain.
 *
 * @param chain - The chain to evaluate.
 * @returns The corresponding relay chain.
 */
export const getRelayChainOf = (chain: TSubstrateChain): TRelaychain => {
  if (chain === 'Polkadot') return 'Polkadot'
  if (chain === 'Kusama') return 'Kusama'
  if (chain === 'Westend') return 'Westend'
  if (chain === 'Paseo') return 'Paseo'

  const ecosystem = getChain(chain).type

  switch (ecosystem) {
    case 'kusama':
      return 'Kusama'
    case 'westend':
      return 'Westend'
    case 'paseo':
      return 'Paseo'
    default:
      return 'Polkadot'
  }
}
