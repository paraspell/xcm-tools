import {
  isExternalChain,
  isSnowbridge,
  isSubstrateBridge,
  isTLocation,
  Parents,
  type TJunction,
  type TLocation,
  type TSubstrateChain,
  type Version
} from '@paraspell/sdk-common'

import type { TDestination, TXcmVersioned } from '../../types'
import { getRelayChainOf } from '../chain'
import { resolveScenario } from '../transfer/resolveScenario'
import { addXcmVersionHeader } from '../xcm-version'
import { createX1Payload } from './createX1Payload'
import { getEthereumJunction } from './getEthereumJunction'

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

  const isSb = !isLocDestination && isSnowbridge(origin, destination)

  if (isSb) {
    return {
      parents: Parents.TWO,
      interior: {
        X1: [getEthereumJunction(origin)]
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
