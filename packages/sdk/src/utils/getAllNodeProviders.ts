import type { TNodePolkadotKusama } from '../types'
import { getNodeEndpointOption } from '../utils'

/**
 * Retrieves all WS provider URLs for a specified Polkadot or Kusama node.
 *
 * @param node - The Polkadot or Kusama node.
 * @returns An array of WS provider URLs.
 * @throws Error if the node does not have any providers.
 */
export const getAllNodeProviders = (node: TNodePolkadotKusama): string[] => {
  const { providers } = getNodeEndpointOption(node) ?? {}
  if (providers && Object.values(providers).length < 1) {
    throw new Error(`Node ${node} does not have any providers.`)
  }
  return Object.values(providers ?? [])
}
