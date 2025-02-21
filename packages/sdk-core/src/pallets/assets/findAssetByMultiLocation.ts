import type { TForeignAsset, TMultiLocation } from '../../types'
import { deepEqual } from '../../utils'
import { compareMultiLocations } from './compareMultiLocations'

export const findAssetByMultiLocation = (
  foreignAssets: TForeignAsset[],
  multiLocation: string | TMultiLocation
): TForeignAsset | undefined => {
  if (typeof multiLocation === 'string') {
    return foreignAssets.find(asset => compareMultiLocations(multiLocation, asset))
  } else {
    return foreignAssets.find(asset => deepEqual(asset.multiLocation, multiLocation))
  }
}
