import { isAssetEqual, type TAssetInfo } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'

export const getFeeAssetInfo = (
  assetInfo: TAssetInfo,
  feeAssetInfo?: TAssetInfo
): TAssetInfo | undefined =>
  feeAssetInfo && !isAssetEqual(assetInfo, feeAssetInfo) ? feeAssetInfo : undefined

export const hasMatchingFeeAssetReserve = <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  chain: TSubstrateChain | TCustomChain,
  assetInfo: TAssetInfo,
  feeAssetInfo: TAssetInfo
): boolean => {
  const resolvedFeeAssetInfo = getFeeAssetInfo(assetInfo, feeAssetInfo)
  return (
    !resolvedFeeAssetInfo ||
    api.getAssetReserveChain(chain, resolvedFeeAssetInfo.location) ===
      api.getAssetReserveChain(chain, assetInfo.location)
  )
}
