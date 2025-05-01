import { deepEqual, type TMultiLocation } from '@paraspell/sdk-common'

import { compareMultiLocations } from '../../multi-location/compareMultiLocations'
import type { TForeignAsset } from '../../types'
import { normalizeMultiLocation } from '../normalizeMultiLocation'

export const findAssetByMultiLocation = (
  foreignAssets: TForeignAsset[],
  multiLocation: string | TMultiLocation
): TForeignAsset | undefined => {
  if (typeof multiLocation === 'string') {
    return foreignAssets.find(asset => compareMultiLocations(multiLocation, asset))
  } else {
    const normalizedMultiLocation = normalizeMultiLocation(multiLocation)
    return foreignAssets.find(asset => {
      const normalizedAssetML = asset.multiLocation && normalizeMultiLocation(asset.multiLocation)
      return deepEqual(normalizedMultiLocation, normalizedAssetML)
    })
  }
}
