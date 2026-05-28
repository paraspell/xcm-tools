import type { TChain, TSubstrateChain } from '../types'
import { isExternalChain } from './chain'

const COMPATIBLE_BRIDGES: [TSubstrateChain, TSubstrateChain][] = [
  ['AssetHubPolkadot', 'AssetHubKusama']
]

export const isSubstrateBridge = <TCustomChain extends string = never>(
  origin: TChain | TCustomChain,
  destination: TChain | TCustomChain
): boolean => {
  if (isExternalChain(origin) || isExternalChain(destination)) return false
  if (!origin.startsWith('AssetHub') || !destination.startsWith('AssetHub')) return false

  return COMPATIBLE_BRIDGES.some(
    ([a, b]) => (a === origin && b === destination) || (b === origin && a === destination)
  )
}

export const isSnowbridge = <TCustomChain extends string = never>(
  _origin: TChain | TCustomChain,
  destination: TChain | TCustomChain
): boolean => {
  return isExternalChain(destination)
}

export const isBridge = <TCustomChain extends string = never>(
  origin: TChain | TCustomChain,
  destination: TChain | TCustomChain
): boolean => {
  return isSubstrateBridge(origin, destination) || isSnowbridge(origin, destination)
}
