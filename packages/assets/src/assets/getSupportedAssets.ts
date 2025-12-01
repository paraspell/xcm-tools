import { isSubstrateBridge, type TChain } from '@paraspell/sdk-common'

import type { TAssetInfo } from '../types'
import { getAssets } from './assets'
import { isAssetXcEqual } from './isAssetXcEqual'

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

  const isSubBridge = isSubstrateBridge(origin, destination)

  if (isSubBridge) {
    return originAssets.filter(asset => asset.symbol === 'KSM' || asset.symbol === 'DOT')
  }

  const supportedAssets = originAssets.filter(asset =>
    destinationAssets.some(a => isAssetXcEqual(a, asset))
  )

  return supportedAssets
}
