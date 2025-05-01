import type { TMultiLocation } from '@paraspell/sdk-common'

/**
 * Converts a multi-location to XCM V4 format. X1 junction of type object is converted to an array.
 *
 * @param multiLocation - The multi-location to normalize.
 * @returns
 */
export const normalizeMultiLocation = (multiLocation: TMultiLocation): TMultiLocation => {
  if (
    multiLocation.interior === 'Here' ||
    multiLocation.interior.X1 === undefined ||
    Array.isArray(multiLocation.interior.X1)
  ) {
    return multiLocation
  }

  return {
    parents: multiLocation.parents,
    interior: { X1: [multiLocation.interior.X1] }
  }
}
