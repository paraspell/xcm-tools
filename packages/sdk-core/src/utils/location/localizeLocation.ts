import type { TChain } from '@paraspell/sdk-common'
import { getJunctionValue, isRelayChain, Parents, type TLocation } from '@paraspell/sdk-common'

import { getParaId } from '../../chains/config'

/**
 * This function localizes a location by removing the `Parachain` junction
 * if it exists. The `parents` field is set to `0` either if a `Parachain` was removed
 * or if the resulting interior is `'Here'` and the chain is a relay chain.
 *
 * @param chain - The current chain
 * @param location - The location to localize
 * @returns The localized location
 */
export const localizeLocation = (chain: TChain, location: TLocation): TLocation => {
  let newInterior: TLocation['interior'] = location.interior
  let parachainRemoved = false

  if (location.interior !== 'Here') {
    const paraId = getParaId(chain)

    const junctions = Object.values(location.interior)
      .flat()
      .filter(junction => typeof junction === 'object' && junction !== null)

    const filteredJunctions = junctions.filter(junction => {
      if ('Parachain' in junction) {
        const paraJunctionId = getJunctionValue<number>(location, 'Parachain')
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

  const shouldSetParentsToZero = parachainRemoved || (newInterior === 'Here' && isRelayChain(chain))

  return {
    parents: shouldSetParentsToZero ? Parents.ZERO : location.parents,
    interior: newInterior
  }
}
