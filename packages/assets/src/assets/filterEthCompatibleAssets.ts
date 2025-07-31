import type { TForeignAssetInfo } from '../types'
import { getOtherAssets } from './assets'
import { findAssetInfoByLoc } from './search'

export const filterEthCompatibleAssets = (assets: TForeignAssetInfo[]): TForeignAssetInfo[] => {
  const ethAssets = getOtherAssets('Ethereum')

  return assets.filter(asset => {
    const location = asset.location
    if (!location) return false
    return Boolean(findAssetInfoByLoc(ethAssets, location))
  })
}
