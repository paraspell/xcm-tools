import type { TNodeWithRelayChains } from '../types'

/**
 * Determines whether a given node is a relay chain (Polkadot or Kusama).
 *
 * @param node - The node to check.
 * @returns True if the node is 'Polkadot' or 'Kusama'; otherwise, false.
 */
export const isRelayChain = (node: TNodeWithRelayChains): node is 'Polkadot' | 'Kusama' =>
  node === 'Polkadot' || node === 'Kusama'

/**
 * Checks if a given node is a system chain.
 *
 * @param node - The node to check.
 * @returns True if the node is a system chain; otherwise, false.
 */
export const isSystemChain = (node: TNodeWithRelayChains): boolean => {
  const systemChains: TNodeWithRelayChains[] = [
    'AssetHubPolkadot',
    'AssetHubKusama',
    'BridgeHubPolkadot',
    'BridgeHubKusama',
    'PeoplePolkadot',
    'PeopleKusama',
    'Mythos'
  ]

  return systemChains.includes(node)
}
