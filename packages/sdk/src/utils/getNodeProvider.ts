import { prodRelayKusama, prodRelayPolkadot } from '@polkadot/apps-config'
import type { TNodeDotKsmWithRelayChains } from '../types'
import { getNode } from '.'

/**
 * Retrieves the WS provider URL for a specified node.
 *
 * @param node - The node for which to get the WS provider URL.
 * @returns The WS provider URL as a string.
 */
export const getNodeProvider = (node: TNodeDotKsmWithRelayChains): string => {
  if (node === 'Polkadot') {
    return prodRelayPolkadot.providers[0]
  } else if (node === 'Kusama') {
    return prodRelayKusama.providers[0]
  }
  return getNode(node).getProvider()
}
