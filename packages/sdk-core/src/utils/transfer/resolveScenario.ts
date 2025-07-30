import type { TSubstrateChain } from '@paraspell/sdk-common'
import { isRelayChain, isTLocation } from '@paraspell/sdk-common'

import type { TDestination, TScenario } from '../../types'

export const resolveScenario = (origin: TSubstrateChain, destination: TDestination): TScenario => {
  if (isRelayChain(origin)) return 'RelayToPara'

  const isRelayDestination = !isTLocation(destination) && isRelayChain(destination)

  if (isRelayDestination) return 'ParaToRelay'

  return 'ParaToPara'
}
