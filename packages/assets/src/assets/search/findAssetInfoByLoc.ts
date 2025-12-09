import { deepEqual, type TLocation } from '@paraspell/sdk-common'

import { compareLocations } from '../../location'
import type { TAssetInfo } from '../../types'
import { normalizeLocation } from '../normalizeLocation'

export const findAssetInfoByLoc = (
  foreignAssets: TAssetInfo[],
  location: string | TLocation
): TAssetInfo | undefined => {
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
