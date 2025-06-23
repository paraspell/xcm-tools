import { isRelayChain, isTMultiLocation } from '@paraspell/sdk-common'

import type { TDestination, TScenario } from '../../types'

export const resolveScenario = (destination: TDestination): TScenario => {
  const isRelayDestination = !isTMultiLocation(destination) && isRelayChain(destination)
  return isRelayDestination ? 'ParaToRelay' : 'ParaToPara'
}
