import type { TNodeDotKsmWithRelayChains, TRelayChain } from '@paraspell/sdk-common'

import { getNode } from '../getNode'

/**
 * Gets the relay chain (Polkadot, Kusama, Westend, or Paseo) of a given chain.
 *
 * @param chain - The chain to evaluate.
 * @returns The corresponding relay chain.
 */
export const getRelayChainOf = (chain: TNodeDotKsmWithRelayChains): TRelayChain => {
  if (chain === 'Polkadot') return 'Polkadot'
  if (chain === 'Kusama') return 'Kusama'
  if (chain === 'Westend') return 'Westend'
  if (chain === 'Paseo') return 'Paseo'

  const ecosystem = getNode(chain).type

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
