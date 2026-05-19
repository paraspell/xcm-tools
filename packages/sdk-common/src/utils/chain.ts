import { CHAINS, EXTERNAL_CHAINS, RELAYCHAINS, SUBSTRATE_CHAINS } from '../constants'
import type { TChain, TExternalChain, TRelaychain, TSubstrateChain } from '../types'

/** * Checks if a given string is a valid chain.
 *
 * @param chain - The string to check.
 * @returns True if the string is a valid chain; otherwise, false.
 */
export const isChain = (chain: string): chain is TChain => CHAINS.some(c => c === chain)

/**
 * Checks if a given string is a valid substrate chain.
 *
 * @param chain - The string to check.
 * @returns True if the string is a valid substrate chain; otherwise, false.
 */
export const isSubstrateChain = (chain: string): chain is TSubstrateChain =>
  SUBSTRATE_CHAINS.some(c => c === chain)

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
export const isExternalChain = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain
): chain is TExternalChain => EXTERNAL_CHAINS.some(c => c === chain)

/**
 * Determines whether a given chain is a custom (user-registered) chain.
 *
 * @param chain - The chain to check.
 * @returns True if the chain is a custom added chain; otherwise, false.
 */
export const isCustomChain = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain
): chain is TCustomChain => !CHAINS.some(c => c === chain)

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
    'Encointer',
    'CollectivesWestend'
  ]

  return systemChains.includes(chain) || isRelayChain(chain)
}

export const isTrustedChain = (chain: TChain): boolean => {
  const trusted: TChain[] = ['Mythos', 'Encointer']
  const isTrustedByAh = (chain: TChain) => trusted.includes(chain)
  return isTrustedByAh(chain) || isSystemChain(chain)
}
