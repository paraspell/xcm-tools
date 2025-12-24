import type { TChain } from '@paraspell/sdk-common'
import {
  deepEqual,
  getJunctionValue,
  hasJunction,
  isExternalChain,
  isRelayChain,
  Parents,
  type TLocation
} from '@paraspell/sdk-common'

import { getParaId } from '../../chains/config'
import { RELAY_LOCATION } from '../../constants'
import { getRelayChainOf } from '../chain'

/**
 * This function localizes a location by removing the `Parachain` junction
 * if it exists. The `parents` field is set to `0` either if a `Parachain` was removed
 * or if the resulting interior is `'Here'` and the chain is a relay chain.
 *
 * @param chain - The current chain
 * @param location - The location to localize
 * @returns The localized location
 */
export const localizeLocation = (
  chain: TChain,
  location: TLocation,
  origin?: TChain
): TLocation => {
  const targetRelay = isExternalChain(chain) ? undefined : getRelayChainOf(chain).toLowerCase()

  const originRelay =
    origin && !isExternalChain(origin) ? getRelayChainOf(origin).toLowerCase() : undefined

  const locationConsensus = getJunctionValue<Record<string, null> | undefined>(
    location,
    'GlobalConsensus'
  )
  const locationRelay = locationConsensus
    ? Object.keys(locationConsensus)[0]?.toLowerCase()
    : undefined

  const ecosystemDiffers = targetRelay && originRelay && originRelay !== targetRelay

  const junctions =
    location.interior === 'Here'
      ? []
      : Object.values(location.interior)
          .flat()
          .filter(junction => typeof junction === 'object' && junction !== null)
  const junctionCount = junctions.length

  const isLocationOnTargetRelay = targetRelay !== undefined && locationRelay === targetRelay

  if (!origin && locationRelay && targetRelay && locationRelay !== targetRelay) {
    return location
  }

  if (
    origin &&
    ecosystemDiffers &&
    location.parents === Parents.TWO &&
    originRelay !== undefined &&
    targetRelay !== undefined &&
    deepEqual(getJunctionValue(location, 'GlobalConsensus'), { [targetRelay]: null }) &&
    junctionCount === 1
  ) {
    return RELAY_LOCATION
  }

  let newInterior: TLocation['interior'] = location.interior
  let parachainRemoved = false

  if (location.interior !== 'Here') {
    const paraId = getParaId(chain)

    const filteredJunctions = junctions.filter(junction => {
      if ('GlobalConsensus' in junction && isLocationOnTargetRelay) {
        return false
      }

      if ('Parachain' in junction && (!ecosystemDiffers || isLocationOnTargetRelay)) {
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

  const isOriginRelayHere = deepEqual(location, RELAY_LOCATION)

  const hasGlobalConsensus = hasJunction(location, 'GlobalConsensus')

  if (
    origin &&
    ecosystemDiffers &&
    isOriginRelayHere &&
    !hasGlobalConsensus &&
    originRelay !== undefined
  ) {
    return {
      parents: Parents.TWO,
      interior: {
        X2: [
          { GlobalConsensus: { [originRelay]: null } as Record<string, null> },
          { Parachain: getParaId(origin) }
        ]
      }
    } as TLocation
  }

  if (
    origin &&
    ecosystemDiffers &&
    newInterior !== 'Here' &&
    !hasGlobalConsensus &&
    originRelay !== undefined
  ) {
    const junctions = Object.values(newInterior)
      .flat()
      .filter(junction => typeof junction === 'object' && junction !== null)

    const updatedJunctions = [
      { GlobalConsensus: { [originRelay]: null } as Record<string, null> },
      ...junctions
    ]

    return {
      parents: Parents.TWO,
      interior: {
        [`X${updatedJunctions.length}`]: updatedJunctions
      }
    } as TLocation
  }

  const shouldSetParentsToZero = parachainRemoved || (newInterior === 'Here' && isRelayChain(chain))

  return {
    parents: shouldSetParentsToZero ? Parents.ZERO : location.parents,
    interior: newInterior
  }
}
