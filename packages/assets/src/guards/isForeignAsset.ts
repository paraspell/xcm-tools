import type { TAssetInfo, TForeignAssetInfo } from '../types'

export const isForeignAsset = (asset: TAssetInfo): asset is TForeignAssetInfo => {
  return (
    typeof asset === 'object' &&
    asset !== null &&
    ('assetId' in asset || 'location' in asset) &&
    !('isNative' in asset)
  )
}
