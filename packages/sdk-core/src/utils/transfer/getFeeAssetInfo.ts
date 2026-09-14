import { isAssetEqual, type TAssetInfo } from '@paraspell/assets'

export const getFeeAssetInfo = (
  assetInfo: TAssetInfo,
  feeAssetInfo?: TAssetInfo
): TAssetInfo | undefined =>
  feeAssetInfo && !isAssetEqual(assetInfo, feeAssetInfo) ? feeAssetInfo : undefined
