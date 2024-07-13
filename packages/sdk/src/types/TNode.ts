import { type NODES_WITH_RELAY_CHAINS, type NODE_NAMES } from '../maps/consts'

export type TNode = (typeof NODE_NAMES)[number]
export type TNodePolkadotKusama = Exclude<TNode, 'Ethereum'>
export type TNodeWithRelayChains = (typeof NODES_WITH_RELAY_CHAINS)[number]
export type TNodeDotKsmWithRelayChains = Exclude<TNodeWithRelayChains, 'Ethereum'>
export type TNodeToAssetModuleMap = Record<TNode, string | null>
