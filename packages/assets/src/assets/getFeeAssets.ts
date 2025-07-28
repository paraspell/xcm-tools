import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import { InvalidCurrencyError } from '../errors'
import type { TAssetInfo, TNativeAssetInfo } from '../types'
import { getAssetsObject } from './assets'

export const getFeeAssets = (
  node: TNodeDotKsmWithRelayChains
): Omit<TAssetInfo, 'isFeeAsset'>[] => {
  const assetsObject = getAssetsObject(node)

  const allAssets = [...assetsObject.nativeAssets, ...assetsObject.otherAssets]

  const stripFlag = ({ isFeeAsset: _flag, ...rest }: TAssetInfo) => rest

  const feeAssets = allAssets.filter(asset => asset.isFeeAsset === true).map(stripFlag)

  const mainNativeAsset = assetsObject.nativeAssets.find(
    nativeAsset => nativeAsset.symbol === assetsObject.nativeAssetSymbol
  )

  if (!mainNativeAsset) {
    throw new InvalidCurrencyError(`No main native asset found for node ${node}`)
  }

  if (feeAssets.length === 0) {
    return [stripFlag(mainNativeAsset)]
  }

  const nativeIncluded = feeAssets.some(
    a => a.symbol === mainNativeAsset.symbol && (a as TNativeAssetInfo).isNative === true
  )

  if (!nativeIncluded) {
    feeAssets.push(stripFlag(mainNativeAsset))
  }

  return feeAssets
}
