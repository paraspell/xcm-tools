import type { TChain } from '@paraspell/sdk-common'

import type { TAssetInfo } from '../types'
import { getAssetsObject } from './assets'
import { findNativeAssetInfoOrThrow } from './search'

export const getFeeAssets = (chain: TChain): Omit<TAssetInfo, 'isFeeAsset'>[] => {
  const { assets } = getAssetsObject(chain)

  const stripFlag = ({ isFeeAsset: _flag, ...rest }: TAssetInfo) => rest

  const feeAssets = assets.filter(asset => asset.isFeeAsset === true).map(stripFlag)

  const mainNativeAsset = findNativeAssetInfoOrThrow(chain)

  if (feeAssets.length === 0) {
    return [stripFlag(mainNativeAsset)]
  }

  const nativeIncluded = feeAssets.some(
    a => a.symbol === mainNativeAsset.symbol && a.isNative === true
  )

  if (!nativeIncluded) {
    feeAssets.push(stripFlag(mainNativeAsset))
  }

  return feeAssets
}
