import type { TNodeWithRelayChains } from '@paraspell/sdk-common'

import type { TAsset, TForeignAsset } from '../types'
import { getAssets, getNativeAssetSymbol, getOtherAssets } from './assets'
import { filterEthCompatibleAssets } from './filterEthCompatibleAssets'
import { isSymbolMatch } from './isSymbolMatch'
import { normalizeSymbol } from './normalizeSymbol'

/**
 * Retrieves the list of assets that are supported for transfers between two specified nodes.
 *
 * @param origin - The origin node.
 * @param destination - The destination node.
 * @returns An array of assets supported between the origin and destination nodes.
 */
export const getSupportedAssets = (
  origin: TNodeWithRelayChains,
  destination: TNodeWithRelayChains
): TAsset[] => {
  const originAssets = getAssets(origin)
  const destinationAssets = getAssets(destination)

  if (destination === 'Ethereum' || origin === 'Ethereum') {
    const otherAssets = getOtherAssets(origin)
    const ethereumCompatibleAssets = filterEthCompatibleAssets(otherAssets)
    const ethereumAssets = getOtherAssets('Ethereum')

    if (origin === 'Moonbeam') {
      return ethereumCompatibleAssets
    }

    if (origin === 'Mythos') {
      return ethereumAssets.filter(asset =>
        isSymbolMatch(asset.symbol, getNativeAssetSymbol(origin))
      )
    }

    return [...ethereumCompatibleAssets, ...ethereumAssets]
  }

  if (
    (origin === 'AssetHubPolkadot' && destination === 'AssetHubKusama') ||
    (origin === 'AssetHubKusama' && destination === 'AssetHubPolkadot')
  ) {
    return originAssets.filter(asset => asset.symbol === 'KSM' || asset.symbol === 'DOT')
  }

  const supportedAssets = originAssets.filter(asset =>
    destinationAssets.some(a => normalizeSymbol(a.symbol) === normalizeSymbol(asset.symbol))
  )

  if (origin === 'AssetHubPolkadot' && destination === 'BifrostPolkadot') {
    const wethAsset = getOtherAssets('Ethereum').find(({ symbol }) => symbol === 'WETH')
    if (wethAsset)
      supportedAssets.push({
        assetId: wethAsset.assetId,
        symbol: `${wethAsset.symbol}.e`
      } as TForeignAsset)
  }

  return supportedAssets
}
