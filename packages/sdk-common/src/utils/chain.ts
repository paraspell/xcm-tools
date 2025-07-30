import { RELAY_CHAINS } from '../constants'
import type { TChainWithRelayChains, TRelayChain } from '../types'

/**
 * Determines whether a given chain is a relay chain (Polkadot or Kusama).
 *
 * @param chain - The chain to check.
 * @returns True if the chain is 'Polkadot' or 'Kusama'; otherwise, false.
 */
export const isRelayChain = (chain: TChainWithRelayChains): chain is TRelayChain =>
  RELAY_CHAINS.includes(chain as TRelayChain)

/**
 * Checks if a given chain is a system chain.
 *
 * @param chain - The chain to check.
 * @returns True if the chain is a system chain; otherwise, false.
 */
export const isSystemChain = (chain: TChainWithRelayChains): boolean => {
  const systemChains: TChainWithRelayChains[] = [
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

  return systemChains.includes(chain) || isRelayChain(chain)
}
