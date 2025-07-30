import { RELAYCHAINS } from '../constants'
import type { TChain, TRelaychain } from '../types'

/**
 * Determines whether a given chain is a relaychain.
 *
 * @param chain - The chain to check.
 * @returns True if the chain is a relaychain; otherwise, false.
 */
export const isRelayChain = (chain: TChain): chain is TRelaychain =>
  RELAYCHAINS.includes(chain as TRelaychain)

/**
 * Checks if a given chain is a system chain.
 *
 * @param chain - The chain to check.
 * @returns True if the chain is a system chain; otherwise, false.
 */
export const isSystemChain = (chain: TChain): boolean => {
  const systemChains: TChain[] = [
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
