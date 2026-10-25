import { deepEqual, type TLocation } from '@paraspell/sdk-common'

import { compareLocations } from '../../location'
import type { TAssetInfo } from '../../types'
import { canonicalizeLocation } from '../normalizeLocation'

export const findAssetInfoByLoc = (
  foreignAssets: TAssetInfo[],
  location: string | TLocation
): TAssetInfo | undefined => {
  if (typeof location === 'string') {
    const matches = foreignAssets.filter(asset => compareLocations(location, asset))
    if (matches.length > 1) {
      throw new DuplicateAssetIdError(`Multiple assets found for location: ${location}`)
    }
    return matches[0]
  }

  const normalizedLocation = canonicalizeLocation(location)
  const matches = foreignAssets.filter(
    asset => asset.location && deepEqual(normalizedLocation, canonicalizeLocation(asset.location))
  )
  if (matches.length > 1) {
    throw new DuplicateAssetIdError(`Multiple assets found for location: ${location}`)
  }
  return matches[0]
}
