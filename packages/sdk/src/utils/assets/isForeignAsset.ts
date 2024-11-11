import type { TAsset, TForeignAsset } from '../../types'

export const isForeignAsset = (asset: TAsset): asset is TForeignAsset => {
  return (
    typeof asset === 'object' &&
    asset !== null &&
    ('assetId' in asset || 'multiLocation' in asset || 'xcmInterior' in asset)
  )
}
