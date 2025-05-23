import type { TNodeDotKsmWithRelayChains, TNodeWithRelayChains } from '../types'

export const isDotKsmBridge = (
  origin: TNodeDotKsmWithRelayChains,
  destination: TNodeWithRelayChains
) =>
  (origin === 'AssetHubPolkadot' && destination === 'AssetHubKusama') ||
  (origin === 'AssetHubKusama' && destination === 'AssetHubPolkadot')
