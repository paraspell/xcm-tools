import {
  isEthereumBridgeOrigin,
  isExternalChain,
  isSubstrateBridge,
  type TChain
} from '@paraspell/sdk-common'

import type { TCustomCtx } from '../types'
import { getRelayChainSymbolImpl } from './assets'

export const isDestinationReachableImpl = <TCustomChain extends string = never>(
  origin: TChain | TCustomChain,
  destination: TChain | TCustomChain,
  ctx?: TCustomCtx
): boolean => {
  if (isExternalChain(origin)) {
    return !isExternalChain(destination) && isEthereumBridgeOrigin(destination, origin)
  }

  if (isExternalChain(destination)) {
    return isEthereumBridgeOrigin(origin, destination)
  }

  if (isSubstrateBridge(origin, destination)) return true

  return getRelayChainSymbolImpl(origin, ctx) === getRelayChainSymbolImpl(destination, ctx)
}

export const isDestinationReachable = (origin: TChain, destination: TChain): boolean =>
  isDestinationReachableImpl(origin, destination)
