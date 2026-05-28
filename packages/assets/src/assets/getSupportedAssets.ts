import { isSnowbridge, isSubstrateBridge, type TChain } from '@paraspell/sdk-common'

import type { TAssetInfo, TCustomCtx } from '../types'
import { getAssetsImpl, getNativeAssetSymbolImpl } from './assets'
import { isAssetXcEqual } from './isAssetXcEqual'
import { isSystemAsset } from './isSystemAsset'
import { findStablecoinAssets } from './search/findStablecoinAssets'

export const getSupportedAssetsImpl = <TCustomChain extends string = never>(
  origin: TChain | TCustomChain,
  destination: TChain | TCustomChain,
  ctx?: TCustomCtx
): TAssetInfo[] => {
  const originAssets = getAssetsImpl(origin, ctx)
  const destinationAssets = getAssetsImpl(destination, ctx)

  const supportedAssets = originAssets.filter(asset =>
    destinationAssets.some(a => isAssetXcEqual(a, asset))
  )

  const isSubBridge = isSubstrateBridge(origin, destination)
  const isSb = isSnowbridge(origin, destination)

  if (isSubBridge || isSb) {
    const systemAssets = originAssets.filter(asset => isSystemAsset(asset))

    if (isSubBridge) {
      const nativeSymbols = [origin, destination].map(chain => getNativeAssetSymbolImpl(chain, ctx))
      const filteredSystemAssets = systemAssets.filter(({ symbol }) =>
        nativeSymbols.includes(symbol)
      )
      const stablecoinAssets = findStablecoinAssets(origin)
      return [...filteredSystemAssets, ...stablecoinAssets]
    } else {
      // MYTH has two valid locations (native on Mythos, ERC-20 on Ethereum),
      // so it isn't matched by isAssetXcEqual. Include it explicitly.
      const mythosNative =
        origin === 'Mythos' && destination === 'Ethereum'
          ? originAssets.filter(asset => asset.symbol === 'MYTH')
          : []
      return [...systemAssets, ...mythosNative, ...supportedAssets]
    }
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
