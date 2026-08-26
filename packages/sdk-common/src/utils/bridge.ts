import type { TChain, TExternalChain, TSubstrateChain } from '../types'
import { isExternalChain } from './chain'

const COMPATIBLE_BRIDGES: [TSubstrateChain, TSubstrateChain][] = [
  ['AssetHubPolkadot', 'AssetHubKusama']
]

const ETHEREUM_BRIDGE_ORIGINS_MAP: Record<TExternalChain, TSubstrateChain[]> = {
  Ethereum: ['AssetHubPolkadot', 'Hydration', 'BifrostPolkadot', 'Mythos'],
  EthereumTestnet: ['AssetHubPaseo', 'AssetHubWestend']
}

export const ETHEREUM_BRIDGE_ORIGINS: TSubstrateChain[] = Object.values(
  ETHEREUM_BRIDGE_ORIGINS_MAP
).flat()

export const isEthereumBridgeOrigin = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  externalChain: TExternalChain
): boolean => ETHEREUM_BRIDGE_ORIGINS_MAP[externalChain].some(c => c === chain)

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
