import { isSnowbridge, isSubstrateBridge, type TChain } from '@paraspell/sdk-common'

import type { TAssetInfo, TCustomCtx } from '../types'
import { getAssetsImpl, getNativeAssetSymbolImpl } from './assets'
import { isAdditionalSubstrateBridgeAsset } from './isAdditionalSubstrateBridgeAsset'
import { isAssetEqual } from './isAssetEqual'
import { isDestinationReachableImpl } from './isDestinationReachable'
import { isSystemAsset } from './isSystemAsset'
import { findBestMatches } from './search/findBestMatches'
import { findStablecoinAssets } from './search/findStablecoinAssets'

export const getSupportedAssetsImpl = <TCustomChain extends string = never>(
  origin: TChain | TCustomChain,
  destination: TChain | TCustomChain,
  ctx?: TCustomCtx
): TAssetInfo[] => {
  if (!isDestinationReachableImpl(origin, destination, ctx)) return []

  const originAssets = getAssetsImpl(origin, ctx)
  const destinationAssets = getAssetsImpl(destination, ctx)

  const supportedAssets = originAssets.filter(asset =>
    destinationAssets.some(a => isAssetEqual(a, asset))
  )

  if (isSubstrateBridge(origin, destination)) {
    const nativeSymbols = [origin, destination].map(chain => getNativeAssetSymbolImpl(chain, ctx))
    const systemAssets = originAssets.filter(
      asset => isSystemAsset(asset) && nativeSymbols.includes(asset.symbol)
    )
    const stablecoinAssets = findStablecoinAssets(origin)
    const additionalBridgeAssets = supportedAssets.filter(isAdditionalSubstrateBridgeAsset)
    return [...systemAssets, ...stablecoinAssets, ...additionalBridgeAssets]
  }

  if (isSnowbridge(origin, destination)) {
    const systemAssets = originAssets.filter(
      asset => isSystemAsset(asset) && findBestMatches(destinationAssets, asset.symbol).length > 0
    )
    // MYTH has two valid locations (native on Mythos, ERC-20 on Ethereum),
    // so it isn't matched by isAssetEqual. Include it explicitly.
    const mythosNative =
      origin === 'Mythos' ? originAssets.filter(asset => asset.symbol === 'MYTH') : []
    return [...systemAssets, ...mythosNative, ...supportedAssets]
  }

  return supportedAssets
}

/**
 * Retrieves the list of assets that are supported for transfers between two specified chains.
 *
 * @param origin - The origin chain.
 * @param destination - The destination chain.
 * @returns An array of assets supported between the origin and destination chains.
 */
export const getSupportedAssets = (origin: TChain, destination: TChain): TAssetInfo[] =>
  getSupportedAssetsImpl(origin, destination)
