import { Parents, type TLocation } from '@paraspell/sdk-common'

export const reverseTransformLocation = (location: TLocation): TLocation => {
  const parachainJunction = { Parachain: 1000 }

  const alreadyHasP1000 =
    location.interior !== 'Here' &&
    Object.values(location.interior)
      .flat()
      .some(
        j =>
          typeof j === 'object' &&
          j !== null &&
          'Parachain' in j &&
          (j as { Parachain: number }).Parachain === 1000
      )

  if (alreadyHasP1000) {
    return { ...location, parents: Parents.ONE }
  }

  const existingJunctions =
    location.interior === 'Here'
      ? [] // no other junctions
      : Object.values(location.interior).flat()

  const allJunctions = [parachainJunction, ...existingJunctions]

  return {
    ...location,
    parents: Parents.ONE,
    interior: { [`X${allJunctions.length}`]: allJunctions }
  }
}
