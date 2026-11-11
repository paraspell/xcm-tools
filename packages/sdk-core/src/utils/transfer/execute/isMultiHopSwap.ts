import { findNativeAssetInfoOrThrow, isAssetEqual, type TAssetInfo } from '@paraspell/assets'
import type { TParachain } from '@paraspell/sdk-common'

export const isMultiHopSwap = (
  exchangeChain: TParachain,
  assetFrom: TAssetInfo,
  assetTo: TAssetInfo
): boolean => {
  const isAssetHub = exchangeChain.includes('AssetHub')
  const nativeAsset = findNativeAssetInfoOrThrow(exchangeChain)
  return isAssetHub && !isAssetEqual(assetFrom, nativeAsset) && !isAssetEqual(assetTo, nativeAsset)
}
