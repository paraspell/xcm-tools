import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import type { TDestination } from '../../types'

export const isBridgeTransfer = (origin: TNodeDotKsmWithRelayChains, destination: TDestination) =>
  (origin === 'AssetHubPolkadot' && destination === 'AssetHubKusama') ||
  (origin === 'AssetHubKusama' && destination === 'AssetHubPolkadot')
