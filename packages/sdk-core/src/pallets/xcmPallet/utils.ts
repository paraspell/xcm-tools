import type {
  TJunction,
  TLocation,
  TParachain,
  TRelaychain,
  TSubstrateChain,
  Version
} from '@paraspell/sdk-common'
import {
  getJunctionValue,
  isExternalChain,
  isSubstrateBridge,
  PARACHAINS
} from '@paraspell/sdk-common'
import { isTLocation, Parents } from '@paraspell/sdk-common'

import { getParaId } from '../../chains/config'
import { RoutingResolutionError } from '../../errors'
import type { TXcmVersioned } from '../../types'
import { type TDestination } from '../../types'
import { addXcmVersionHeader, createX1Payload, getRelayChainOf } from '../../utils'
import { resolveScenario } from '../../utils/transfer/resolveScenario'

export const createDestination = (
  version: Version,
  origin: TSubstrateChain,
  destination: TDestination,
  chainId?: number,
  junction?: TJunction,
  parents?: Parents
): TLocation => {
  const isLocDestination = isTLocation(destination)

  const isSubBridge =
    !isLocDestination && !isExternalChain(destination) && isSubstrateBridge(origin, destination)

  if (isSubBridge) {
    return {
      parents: Parents.TWO,
      interior: {
        X2: [
          { GlobalConsensus: getRelayChainOf(destination) },
          {
            Parachain: chainId
          }
        ]
      }
    }
  }

  const scenario = resolveScenario(origin, destination)
  const parentsResolved = parents ?? (scenario === 'RelayToPara' ? Parents.ZERO : Parents.ONE)
  const interior =
    scenario === 'ParaToRelay'
      ? 'Here'
      : createX1Payload(version, junction ?? { Parachain: chainId })

  return isLocDestination ? destination : ({ parents: parentsResolved, interior } as TLocation)
}

export const createVersionedDestination = (
  version: Version,
  origin: TSubstrateChain,
  destination: TDestination,
  chainId?: number,
  junction?: TJunction,
  parents?: Parents
): TXcmVersioned<TLocation> => {
  const plainDestination = createDestination(
    version,
    origin,
    destination,
    chainId,
    junction,
    parents
  )

  return addXcmVersionHeader(plainDestination, version)
}

export const resolveTChainFromLocation = (
  relaychain: TRelaychain,
  location: TLocation
): TParachain => {
  const parachainId = getJunctionValue(location, 'Parachain')
  if (parachainId === undefined) {
    throw new RoutingResolutionError('Parachain ID not found in destination location.')
  }

  const chain =
    PARACHAINS.find(
      chain => getParaId(chain) === parachainId && getRelayChainOf(chain) === relaychain
    ) ?? null

  if (chain === null) {
    throw new RoutingResolutionError(
      'Chain with specified paraId not found in destination location.'
    )
  }

  return chain
}

export { constructRelayToParaParams } from './constructRelayToParaParams'
