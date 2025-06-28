import { getNativeAssetSymbol, type TAsset } from '@paraspell/assets'
import type { TNodePolkadotKusama } from '@paraspell/sdk-common'

export const isMultiHopSwap = (
  exchangeChain: TNodePolkadotKusama,
  assetFrom: TAsset,
  assetTo: TAsset
): boolean => {
  const isAssetHub = exchangeChain.includes('AssetHub')
  const nativeSymbol = getNativeAssetSymbol(exchangeChain)
  return isAssetHub && assetFrom.symbol !== nativeSymbol && assetTo.symbol !== nativeSymbol
}
