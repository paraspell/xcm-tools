import type { TChain } from '@paraspell/sdk-common'
import { isRelayChain, isTLocation } from '@paraspell/sdk-common'

import type { TDestination, TScenario } from '../../types'

export const resolveScenario = <TCustomChain extends string = never>(
  origin: TChain | TCustomChain,
  destination: TDestination | TCustomChain
): TScenario => {
  if (isRelayChain(origin)) return 'RelayToPara'

  const isRelayDestination = !isTLocation(destination) && isRelayChain(destination)

  if (isRelayDestination) return 'ParaToRelay'

  return 'ParaToPara'
}
