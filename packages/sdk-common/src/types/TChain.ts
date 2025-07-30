import type { CHAIN_NAMES, CHAINS_WITH_RELAY_CHAINS, RELAY_CHAINS } from '../constants'

export type TChain = (typeof CHAIN_NAMES)[number]
export type TRelayChain = (typeof RELAY_CHAINS)[number]
export type TChainPolkadotKusama = Exclude<TChain, 'Ethereum'>
export type TChainWithRelayChains = (typeof CHAINS_WITH_RELAY_CHAINS)[number]
export type TChainDotKsmWithRelayChains = Exclude<TChainWithRelayChains, 'Ethereum'>

/** @deprecated Use `TChain` instead. */
export type TNode = TChain

/** @deprecated Use `TChainWithRelayChains` instead. */
export type TNodeWithRelayChains = TChainWithRelayChains

/** @deprecated Use `TChainPolkadotKusama` instead. */
export type TNodePolkadotKusama = TChainPolkadotKusama

/** @deprecated Use `TChainDotKsmWithRelayChains` instead. */
export type TNodeDotKsmWithRelayChains = TChainDotKsmWithRelayChains
