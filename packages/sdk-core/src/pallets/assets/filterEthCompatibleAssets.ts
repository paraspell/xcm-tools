import type { TForeignAsset, TMultiLocation } from '../../types'
import { getOtherAssets } from './assets'
import { findAssetByMultiLocation } from './findAssetByMultiLocation'

export const filterEthCompatibleAssets = (assets: TForeignAsset[]): TForeignAsset[] => {
  const ethAssets = getOtherAssets('Ethereum')

  return assets.filter(asset => {
    const assetMultiLoc = asset.multiLocation
    if (!assetMultiLoc) return false

    return Boolean(findAssetByMultiLocation(ethAssets, assetMultiLoc as TMultiLocation))
  })
}
