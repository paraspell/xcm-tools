import type { TLocation } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

/**
 * Converts a location to a specific XCM version
 *
 * In XCM v3, `interior.X1` is a single `Object`. In XCM V4, `interior.X1` is an `Array<Object>`.
 *
 * @param location - The location to normalize.
 * @param version - The target XCM version: `'V3'`, `'V4'` or `'V5'`. Defaults to `'V5'`.
 * @returns A new transformed `TLocation`
 */
export const normalizeLocation = (
  location: TLocation,
  version: Version = Version.V5
): TLocation => {
  if (location.interior === 'Here' || location.interior.X1 === undefined) {
    return location
  }

  const currentX1 = location.interior.X1

  if (version === Version.V4 || version === Version.V5) {
    if (Array.isArray(currentX1)) {
      // Already in V4/V5 format
      return location
    }

    return {
      parents: location.parents,
      interior: { X1: [currentX1] }
    }
  } else {
    if (!Array.isArray(currentX1)) {
      // Already in V3 format
      return location
    }

    return {
      parents: location.parents,
      interior: { X1: currentX1[0] }
    }
  }
}
