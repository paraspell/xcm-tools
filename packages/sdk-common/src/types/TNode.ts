import type { NODE_NAMES, NODES_WITH_RELAY_CHAINS } from '../constants'

export type TNode = (typeof NODE_NAMES)[number]
export type TNodePolkadotKusama = Exclude<TNode, 'Ethereum'>
export type TNodeWithRelayChains = (typeof NODES_WITH_RELAY_CHAINS)[number]
export type TNodeDotKsmWithRelayChains = Exclude<TNodeWithRelayChains, 'Ethereum'>
