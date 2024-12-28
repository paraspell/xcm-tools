import type { TDestination, TNodeDotKsmWithRelayChains } from '../../types'

export const isBridgeTransfer = (origin: TNodeDotKsmWithRelayChains, destination: TDestination) =>
  (origin === 'AssetHubPolkadot' && destination === 'AssetHubKusama') ||
  (origin === 'AssetHubKusama' && destination === 'AssetHubPolkadot')
