// Contains function for getting Asset ID or Symbol used in XCM call creation

import { type TCurrencyInput, type TNode } from '../../types'
import { getAssetsObject } from './assets'

export const getAssetBySymbolOrId = (
  node: TNode,
  currency: TCurrencyInput
): { symbol?: string; assetId?: string } | null => {
  if (typeof currency === 'object') {
    return null
  }

  const currencyString = currency.toString()

  const { otherAssets, nativeAssets, relayChainAssetSymbol } = getAssetsObject(node)

  const asset = [...otherAssets, ...nativeAssets].find(
    ({ symbol, assetId }) => symbol === currencyString || assetId === currencyString
  )

  if (asset !== undefined) {
    const { symbol, assetId } = asset
    return { symbol, assetId }
  }

  if (relayChainAssetSymbol === currencyString) return { symbol: relayChainAssetSymbol }

  return null
}
