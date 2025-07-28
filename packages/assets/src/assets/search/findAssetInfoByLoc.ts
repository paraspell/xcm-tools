import { deepEqual, type TLocation } from '@paraspell/sdk-common'

import { compareLocations } from '../../location'
import type { TForeignAssetInfo } from '../../types'
import { normalizeLocation } from '../normalizeLocation'

export const findAssetInfoByLoc = (
  foreignAssets: TForeignAssetInfo[],
  location: string | TLocation
): TForeignAssetInfo | undefined => {
  if (typeof location === 'string') {
    return foreignAssets.find(asset => compareLocations(location, asset))
  } else {
    const normalizedLocation = normalizeLocation(location)
    return foreignAssets.find(asset => {
      const normalizedAssetML = asset.location && normalizeLocation(asset.location)
      return deepEqual(normalizedLocation, normalizedAssetML)
    })
  }
}
