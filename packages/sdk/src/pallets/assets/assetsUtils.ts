// Contains function for getting Asset ID or Symbol used in XCM call creation

import { type TNode } from '../../types'
import { getAssetsObject } from './assets'

export const getAssetBySymbolOrId = (
  node: TNode,
  symbolOrId: string | number
): { symbol?: string; assetId?: string } | null => {
  const { otherAssets, nativeAssets, relayChainAssetSymbol } = getAssetsObject(node)

  const asset = [...otherAssets, ...nativeAssets].find(
    ({ symbol, assetId }) => symbol === symbolOrId || assetId === symbolOrId
  )

  if (asset !== undefined) {
    const { symbol, assetId } = asset
    return { symbol, assetId }
  }

  if (relayChainAssetSymbol === symbolOrId) return { symbol: relayChainAssetSymbol }

  return null
}
