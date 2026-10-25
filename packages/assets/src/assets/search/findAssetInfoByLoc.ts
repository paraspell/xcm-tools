import { deepEqual, type TLocation } from '@paraspell/sdk-common'

import { DuplicateAssetError } from '../../errors'
import { compareLocations } from '../../location'
import type { TAssetInfo } from '../../types'
import { canonicalizeLocation } from '../normalizeLocation'

export const findAssetInfoByLoc = (
  foreignAssets: TAssetInfo[],
  location: string | TLocation
): TAssetInfo | undefined => {
  let matches: TAssetInfo[]

  if (typeof location === 'string') {
    matches = foreignAssets.filter(asset => compareLocations(location, asset))
  } else {
    const normalizedLocation = canonicalizeLocation(location)
    matches = foreignAssets.filter(
      asset => asset.location && deepEqual(normalizedLocation, canonicalizeLocation(asset.location))
    )
  }

  if (matches.length > 1) {
    const locStr = typeof location === 'string' ? location : JSON.stringify(location)
    throw new DuplicateAssetError(
      `Multiple assets found with the same location: ${locStr}. Please specify asset directly by symbol using .currency({symbol: <ASSET_SYMBOL>})`
    )
  }

  return matches[0]
}
