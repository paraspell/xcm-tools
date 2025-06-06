import type { TMultiLocation } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

/**
 * Converts a multi-location to a specific XCM version . Defaults to XCM v4.
 *
 * In XCM v3, `interior.X1` is a single `Object`. In XCM V4, `interior.X1` is an `Array<Object>`.
 *
 * @param multiLocation - The multi-location to normalize.
 * @param version - The target XCM version: `'V3'`, `'V4'` or `'V5'`. Defaults to `'V4'`.
 * @returns A new transformed `TMultiLocation`
 */
export const normalizeMultiLocation = (
  multiLocation: TMultiLocation,
  version: Version = Version.V4
): TMultiLocation => {
  if (multiLocation.interior === 'Here' || multiLocation.interior.X1 === undefined) {
    return multiLocation
  }

  const currentX1 = multiLocation.interior.X1

  if (version === Version.V4 || version === Version.V5) {
    if (Array.isArray(currentX1)) {
      // Already in V4/V5 format
      return multiLocation
    }

    return {
      parents: multiLocation.parents,
      interior: { X1: [currentX1] }
    }
  } else {
    if (!Array.isArray(currentX1)) {
      // Already in V3 format
      return multiLocation
    }

    return {
      parents: multiLocation.parents,
      interior: { X1: currentX1[0] }
    }
  }
}
