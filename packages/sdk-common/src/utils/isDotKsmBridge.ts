import type { TChain } from '../types'

export const isDotKsmBridge = (origin: TChain, destination: TChain) =>
  (origin === 'AssetHubPolkadot' && destination === 'AssetHubKusama') ||
  (origin === 'AssetHubKusama' && destination === 'AssetHubPolkadot')
