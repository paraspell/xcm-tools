import { EXTERNAL_CHAINS, RELAYCHAINS } from '../constants'
import type { TChain, TExternalChain, TRelaychain } from '../types'

/**
 * Determines whether a given chain is a relaychain.
 *
 * @param chain - The chain to check.
 * @returns True if the chain is a relaychain; otherwise, false.
 */
export const isRelayChain = (chain: TChain): chain is TRelaychain =>
  RELAYCHAINS.includes(chain as TRelaychain)

/**
 * Determines whether a given chain is an external chain.
 *
 * @param chain - The chain to check.
 * @returns True if the chain is an external chain; otherwise, false.
 */
export const isExternalChain = (chain: TChain): chain is TExternalChain =>
  EXTERNAL_CHAINS.includes(chain as TExternalChain)

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
    'CollectivesWestend'
  ]

  return systemChains.includes(chain) || isRelayChain(chain)
}

export const isTrustedChain = (chain: TChain): boolean => {
  const trusted: TChain[] = ['Mythos', 'Encointer']
  const isTrustedByAh = (chain: TChain) => trusted.includes(chain)
  return isTrustedByAh(chain) || isSystemChain(chain)
}
