import { DuplicateAssetIdError } from '../../errors'
import type { TCurrency, TForeignAssetInfo } from '../../types'

export const findAssetInfoById = (assets: TForeignAssetInfo[], assetId: TCurrency) => {
  const otherAssetsMatches = assets.filter(
    ({ assetId: currentAssetId }) => currentAssetId === assetId.toString()
  )

  if (otherAssetsMatches.length > 1) {
    throw new DuplicateAssetIdError(assetId.toString())
  }

  return assets.find(({ assetId: currentAssetId }) => currentAssetId === assetId.toString())
}
