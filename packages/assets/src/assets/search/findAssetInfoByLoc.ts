import { deepEqual, type TLocation } from '@paraspell/sdk-common'

import { compareLocations } from '../../location'
import type { TAssetInfo } from '../../types'
import { canonicalizeLocation } from '../normalizeLocation'

export const findAssetInfoByLoc = (
  foreignAssets: TAssetInfo[],
  location: string | TLocation
): TAssetInfo | undefined => {
  if (typeof location === 'string') {
    return foreignAssets.find(asset => compareLocations(location, asset))
  }

  const normalizedLocation = canonicalizeLocation(location)
  return foreignAssets.find(
    asset => asset.location && deepEqual(normalizedLocation, canonicalizeLocation(asset.location))
  )
}
