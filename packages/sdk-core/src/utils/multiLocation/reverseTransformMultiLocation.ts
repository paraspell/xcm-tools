import { Parents, type TMultiLocation } from '@paraspell/sdk-common'

export const reverseTransformMultiLocation = (multiLocation: TMultiLocation): TMultiLocation => {
  const parachainJunction = { Parachain: 1000 }

  const alreadyHasP1000 =
    multiLocation.interior !== 'Here' &&
    Object.values(multiLocation.interior)
      .flat()
      .some(
        j =>
          typeof j === 'object' &&
          j !== null &&
          'Parachain' in j &&
          (j as { Parachain: number }).Parachain === 1000
      )

  if (alreadyHasP1000) {
    return { ...multiLocation, parents: Parents.ONE }
  }

  const existingJunctions =
    multiLocation.interior === 'Here'
      ? [] // no other junctions
      : Object.values(multiLocation.interior).flat()

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const allJunctions = [parachainJunction, ...existingJunctions]

  return {
    ...multiLocation,
    parents: Parents.ONE,
    interior: { [`X${allJunctions.length}`]: allJunctions }
  }
}
