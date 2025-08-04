import { hasJunction, Parents, TMultiLocation } from '@paraspell/sdk-common'

export const transformLocation = (location: TMultiLocation, paraId: number): TMultiLocation => {
  if (
    location.parents !== 0 ||
    hasJunction(location, 'Parachain') ||
    location.interior === 'Here'
  ) {
    return location
  }

  // For existing junctions, prepend Parachain
  const { interior } = location

  if (interior.X1 && !Array.isArray(interior.X1)) {
    throw new Error('X1 junction must be an array')
  }

  if (interior.X1 && Array.isArray(interior.X1)) {
    return {
      parents: Parents.ONE,
      interior: { X2: [{ Parachain: paraId }, ...interior.X1] }
    }
  }

  // For X2-X7, increment to next level
  for (let i = 2; i <= 7; i++) {
    const key = `X${i}` as keyof typeof interior
    if (interior[key]) {
      return {
        parents: Parents.ONE,
        interior: {
          [`X${i + 1}`]: [
            { Parachain: paraId },
            ...(Array.isArray(interior[key]) ? interior[key] : [interior[key]])
          ]
        }
      }
    }
  }

  return location
}
