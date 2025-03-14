import { deepEqual, type TMultiLocation } from '@paraspell/sdk-common'

import { compareMultiLocations } from '../../multi-location/compareMultiLocations'
import type { TForeignAsset } from '../../types'

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
