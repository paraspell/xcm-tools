import { isSnowbridge, isSubstrateBridge, type TChain } from '@paraspell/sdk-common'

import type { TAssetInfo } from '../types'
import { getAssets, getNativeAssetSymbol } from './assets'
import { isAssetXcEqual } from './isAssetXcEqual'
import { isSystemAsset } from './isSystemAsset'
import { findStablecoinAssets } from './search/findStablecoinAssets'

/**
 * Retrieves the list of assets that are supported for transfers between two specified chains.
 *
 * @param origin - The origin chain.
 * @param destination - The destination chain.
 * @returns An array of assets supported between the origin and destination chains.
 */
export const getSupportedAssets = (origin: TChain, destination: TChain): TAssetInfo[] => {
  const originAssets = getAssets(origin)
  const destinationAssets = getAssets(destination)

  const supportedAssets = originAssets.filter(asset =>
    destinationAssets.some(a => isAssetXcEqual(a, asset))
  )

  const isSubBridge = isSubstrateBridge(origin, destination)
  const isSb = isSnowbridge(origin, destination)

  if (isSubBridge || isSb) {
    const systemAssets = originAssets.filter(asset => isSystemAsset(asset))

    if (isSubBridge) {
      const nativeSymbols = [origin, destination].map(getNativeAssetSymbol)
      const filteredSystemAssets = systemAssets.filter(({ symbol }) =>
        nativeSymbols.includes(symbol)
      )
      const stablecoinAssets = findStablecoinAssets(origin)
      return [...filteredSystemAssets, ...stablecoinAssets]
    } else {
      return [...systemAssets, ...supportedAssets]
    }
  }

  return supportedAssets
}
