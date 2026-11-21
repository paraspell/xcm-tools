import { deepEqual, type TLocation } from '@paraspell/sdk-common'

import { compareLocations } from '../../location'
import type { TAssetInfo } from '../../types'
import { canonicalizeLocation } from '../normalizeLocation'

export const findAssetInfoByLoc = (
  foreignAssets: TAssetInfo[],
  location: string | TLocation
): TAssetInfo | undefined => {
  if (typeof location === 'string') {
    try {
      const parsed = JSON.parse(location)
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'parents' in parsed &&
        'interior' in parsed
      ) {
        const normalizedLocation = canonicalizeLocation(parsed as TLocation)
        const match = foreignAssets.find(asset =>
          deepEqual(normalizedLocation, canonicalizeLocation(asset.location))
        )
        if (match) return match
      }
    } catch {
      // Not a valid JSON location, fall through to raw string comparison
    }

    return foreignAssets.find(asset => compareLocations(location, asset))
  }

  const normalizedLocation = canonicalizeLocation(location)
  return foreignAssets.find(asset =>
    deepEqual(normalizedLocation, canonicalizeLocation(asset.location))
  )
}
