import { getNativeAssetSymbol, type TAssetInfo } from '@paraspell/assets'
import type { TParachain } from '@paraspell/sdk-common'

export const isMultiHopSwap = (
  exchangeChain: TParachain,
  assetFrom: TAssetInfo,
  assetTo: TAssetInfo
): boolean => {
  const isAssetHub = exchangeChain.includes('AssetHub')
  const nativeSymbol = getNativeAssetSymbol(exchangeChain)
  return isAssetHub && assetFrom.symbol !== nativeSymbol && assetTo.symbol !== nativeSymbol
}
