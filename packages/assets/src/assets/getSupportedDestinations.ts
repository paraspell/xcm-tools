import {
  CHAINS,
  isExternalChain,
  isSubstrateBridge,
  SUBSTRATE_CHAINS,
  type TChain
} from '@paraspell/sdk-common'

import { DuplicateAssetError, InvalidCurrencyError } from '../errors'
import type { TAssetInfo, TCurrencyCore } from '../types'
import { getRelayChainSymbol } from './assets'
import { isAdditionalSubstrateBridgeAsset } from './isAdditionalSubstrateBridgeAsset'
import { isAssetEqual } from './isAssetEqual'
import { isDestinationReachable } from './isDestinationReachable'
import { isStableCoinAsset } from './isStableCoinAsset'
import { isSystemAsset } from './isSystemAsset'
import { findAssetInfoOnDest, findAssetInfoOrThrow, findNativeAssetInfoOrThrow } from './search'

const isUnsupportedAssetHubNative = (
  origin: TChain,
  destination: TChain,
  originAsset: TAssetInfo,
  nativeAssets: TAssetInfo[]
): boolean => {
  if (isExternalChain(origin) || isExternalChain(destination)) return false

  const originIsAssetHub = origin.startsWith('AssetHub')
  const destinationIsAssetHub = destination.startsWith('AssetHub')
  if (originIsAssetHub === destinationIsAssetHub) return false

  if (isSystemAsset(originAsset)) return false

  return nativeAssets.some(native => isAssetEqual(originAsset, native))
}

export const getSupportedDestinations = (origin: TChain, currency: TCurrencyCore): TChain[] => {
  findAssetInfoOrThrow(origin, currency)

  const ecosystem = getRelayChainSymbol(origin)
  const nativeAssets = SUBSTRATE_CHAINS.filter(
    chain => getRelayChainSymbol(chain) === ecosystem
  ).map(chain => findNativeAssetInfoOrThrow(chain))

  return CHAINS.filter(destination => {
    if (destination === origin) return false

    if (!isDestinationReachable(origin, destination)) return false

    // Check if we still can find asset if we specify destination
    let originAsset
    try {
      originAsset = findAssetInfoOrThrow(origin, currency, destination)
    } catch (error) {
      if (error instanceof InvalidCurrencyError) {
        return false
      }
      throw error
    }

    if (isUnsupportedAssetHubNative(origin, destination, originAsset, nativeAssets)) return false

    if (isSubstrateBridge(origin, destination)) {
      return (
        isSystemAsset(originAsset) ||
        isStableCoinAsset(originAsset) ||
        isAdditionalSubstrateBridgeAsset(originAsset)
      )
    }

    try {
      return !!findAssetInfoOnDest(origin, destination, currency, originAsset)
    } catch (error) {
      if (error instanceof DuplicateAssetError) {
        return true
      }
      throw error
    }
  })
}
