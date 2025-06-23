import type { TNodeWithRelayChains } from '@paraspell/sdk-common'
import { getJunctionValue, isRelayChain, Parents, type TMultiLocation } from '@paraspell/sdk-common'

import { getParaId } from '../../nodes/config'

/**
 * This function localizes a multiLocation by removing the `Parachain` junction
 * if it exists. The `parents` field is set to `0` either if a `Parachain` was removed
 * or if the resulting interior is `'Here'` and the node is a relay chain.
 *
 * @param node - The current node
 * @param multiLocation - The multiLocation to localize
 * @returns The localized multiLocation
 */
export const localizeLocation = (
  node: TNodeWithRelayChains,
  multiLocation: TMultiLocation
): TMultiLocation => {
  let newInterior: TMultiLocation['interior'] = multiLocation.interior
  let parachainRemoved = false

  if (multiLocation.interior !== 'Here') {
    const paraId = getParaId(node)

    const junctions = Object.values(multiLocation.interior)
      .flat()
      .filter(junction => typeof junction === 'object' && junction !== null)

    const filteredJunctions = junctions.filter(junction => {
      if ('Parachain' in junction) {
        const paraJunctionId = getJunctionValue<number>(multiLocation, 'Parachain')
        if (paraJunctionId === paraId) {
          parachainRemoved = true
          return false
        }
      }
      return true
    })

    if (filteredJunctions.length === 0) {
      newInterior = 'Here'
    } else {
      newInterior = { [`X${filteredJunctions.length}`]: filteredJunctions }
    }
  }

  const shouldSetParentsToZero = parachainRemoved || (newInterior === 'Here' && isRelayChain(node))

  return {
    parents: shouldSetParentsToZero ? Parents.ZERO : multiLocation.parents,
    interior: newInterior
  }
}
