import type { TChain } from '@paraspell/sdk-common'

import type { TAssetInfo, TForeignAssetInfo } from '../types'
import { getAssets, getNativeAssetSymbol, getOtherAssets } from './assets'
import { filterEthCompatibleAssets } from './filterEthCompatibleAssets'
import { isSymbolMatch } from './isSymbolMatch'
import { normalizeSymbol } from './normalizeSymbol'

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
      } as TForeignAssetInfo)
  }

  return supportedAssets
}
