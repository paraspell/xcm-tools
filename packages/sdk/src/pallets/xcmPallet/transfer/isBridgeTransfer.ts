import type { TDestination, TNodePolkadotKusama } from '../../../types'

export const isBridgeTransfer = (
  origin: TNodePolkadotKusama,
  destination: TDestination | undefined
) => {
  return (
    (origin === 'AssetHubPolkadot' && destination === 'AssetHubKusama') ||
    (origin === 'AssetHubKusama' && destination === 'AssetHubPolkadot')
  )
}
