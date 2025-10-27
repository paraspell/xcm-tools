import type { TChain, TSubstrateChain } from '../types'
import { isExternalChain } from './chain'

const COMPATIBLE_BRIDGES: [TSubstrateChain, TSubstrateChain][] = [
  ['AssetHubPolkadot', 'AssetHubKusama']
]

export const isSubstrateBridge = (origin: TChain, destination: TChain): boolean => {
  if (isExternalChain(origin) || isExternalChain(destination)) return false
  if (!origin.startsWith('AssetHub') || !destination.startsWith('AssetHub')) return false

  return COMPATIBLE_BRIDGES.some(
    ([a, b]) => (a === origin && b === destination) || (b === origin && a === destination)
  )
}
