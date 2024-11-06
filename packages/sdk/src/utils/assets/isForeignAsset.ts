import type { TAsset, TForeignAsset } from '../../types'

export const isForeignAsset = (asset: TAsset): asset is TForeignAsset => {
  return 'assetId' in asset
}
