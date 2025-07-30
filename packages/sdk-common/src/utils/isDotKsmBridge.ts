import type { TChainDotKsmWithRelayChains, TChainWithRelayChains } from '../types'

export const isDotKsmBridge = (
  origin: TChainDotKsmWithRelayChains,
  destination: TChainWithRelayChains
) =>
  (origin === 'AssetHubPolkadot' && destination === 'AssetHubKusama') ||
  (origin === 'AssetHubKusama' && destination === 'AssetHubPolkadot')
