import type { TAssetInfo, TCurrencyCore } from '@paraspell/assets'
import { isForeignAsset } from '@paraspell/assets'

export const getCurrencySelection = (asset: TAssetInfo): TCurrencyCore => {
  if (asset.location) return { location: asset.location }

  if (isForeignAsset(asset) && asset.assetId) {
    return { id: asset.assetId }
  }

  return { symbol: asset.symbol }
}
