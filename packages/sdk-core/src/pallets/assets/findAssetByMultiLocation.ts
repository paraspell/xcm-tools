import type { TForeignAsset, TJunction, TMultiLocation } from '../../types'
import { deepEqual } from '../../utils'
import { compareMultiLocations } from './compareMultiLocations'

export const findAssetByMultiLocation = (
  foreignAssets: TForeignAsset[],
  multiLocation: string | TMultiLocation | TJunction[]
): TForeignAsset | undefined => {
  if (typeof multiLocation === 'string') {
    return foreignAssets.find(asset => compareMultiLocations(multiLocation, asset))
  } else if (Array.isArray(multiLocation)) {
    return foreignAssets.find(asset => deepEqual(asset.xcmInterior, multiLocation))
  } else {
    return foreignAssets.find(asset => deepEqual(asset.multiLocation, multiLocation))
  }
}
