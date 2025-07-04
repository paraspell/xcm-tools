import { RELAY_CHAINS } from '../constants'
import type { TNodeWithRelayChains, TRelayChain } from '../types'

/**
 * Determines whether a given node is a relay chain (Polkadot or Kusama).
 *
 * @param node - The node to check.
 * @returns True if the node is 'Polkadot' or 'Kusama'; otherwise, false.
 */
export const isRelayChain = (node: TNodeWithRelayChains): node is TRelayChain =>
  RELAY_CHAINS.includes(node as TRelayChain)

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
    'AssetHubWestend',
    'AssetHubPaseo',
    'BridgeHubPolkadot',
    'BridgeHubKusama',
    'BridgeHubWestend',
    'BridgeHubPaseo',
    'PeoplePolkadot',
    'PeopleKusama',
    'PeopleWestend',
    'PeoplePaseo',
    'CoretimePolkadot',
    'CoretimeKusama',
    'CoretimeWestend',
    'CoretimePaseo',
    'Collectives',
    'CollectivesWestend',
    'Mythos'
  ]

  return systemChains.includes(node) || isRelayChain(node)
}
