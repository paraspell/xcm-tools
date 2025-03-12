import { Parents, type TMultiLocation } from '../../types'

export const transformMultiLocation = (multiLocation: TMultiLocation): TMultiLocation => {
  let newInterior: TMultiLocation['interior']
  if (multiLocation.interior === 'Here') {
    newInterior = 'Here'
  } else {
    const junctions = Object.values(multiLocation.interior)
      .flat()
      .filter(junction => typeof junction === 'object' && junction !== null)
    const filteredJunctions = junctions.filter(junction => !('Parachain' in junction))
    if (filteredJunctions.length === 0) {
      newInterior = 'Here'
    } else {
      newInterior = { [`X${filteredJunctions.length}`]: filteredJunctions }
    }
  }

  return {
    ...multiLocation,
    parents: Parents.ZERO,
    interior: newInterior
  }
}
