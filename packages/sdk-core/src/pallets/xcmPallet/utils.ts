import { InvalidCurrencyError, type TCurrencyInput } from '@paraspell/assets'
import type {
  TJunction,
  TLocation,
  TNodeDotKsmWithRelayChains,
  TRelayChain,
  Version
} from '@paraspell/sdk-common'
import { getJunctionValue, replaceBigInt } from '@paraspell/sdk-common'
import { isTLocation, Parents } from '@paraspell/sdk-common'
import { NODE_NAMES_DOT_KSM, type TNodePolkadotKusama } from '@paraspell/sdk-common'

import { InvalidParameterError } from '../../errors'
import { getParaId } from '../../nodes/config'
import type { TXcmVersioned } from '../../types'
import { type TDestination } from '../../types'
import { addXcmVersionHeader, createX1Payload, getRelayChainOf } from '../../utils'
import { resolveScenario } from '../../utils/transfer/resolveScenario'

export const createDestination = (
  version: Version,
  origin: TNodeDotKsmWithRelayChains,
  destination: TDestination,
  nodeId?: number,
  junction?: TJunction,
  parents?: Parents
): TLocation => {
  const scenario = resolveScenario(origin, destination)
  const parentsResolved = parents ?? (scenario === 'RelayToPara' ? Parents.ZERO : Parents.ONE)
  const interior =
    scenario === 'ParaToRelay'
      ? 'Here'
      : createX1Payload(version, junction ?? { Parachain: nodeId })

  const isLocationDestination = isTLocation(destination)

  return isLocationDestination ? destination : ({ parents: parentsResolved, interior } as TLocation)
}

export const createVersionedDestination = (
  version: Version,
  origin: TNodeDotKsmWithRelayChains,
  destination: TDestination,
  nodeId?: number,
  junction?: TJunction,
  parents?: Parents
): TXcmVersioned<TLocation> => {
  const plainDestination = createDestination(
    version,
    origin,
    destination,
    nodeId,
    junction,
    parents
  )

  return addXcmVersionHeader(plainDestination, version)
}

export const createBridgeDestination = (
  ecosystem: 'Kusama' | 'Polkadot',
  destination: TDestination,
  nodeId?: number
): TLocation => {
  const location: TLocation = {
    parents: Parents.TWO,
    interior: {
      X2: [
        {
          GlobalConsensus: ecosystem
        },
        {
          Parachain: nodeId
        }
      ]
    }
  }
  return isTLocation(destination) ? destination : location
}

export const resolveTNodeFromLocation = (
  relayChain: TRelayChain,
  location: TLocation
): TNodePolkadotKusama => {
  const parachainId = getJunctionValue(location, 'Parachain')
  if (parachainId === undefined) {
    throw new InvalidParameterError('Parachain ID not found in destination location.')
  }

  const node =
    NODE_NAMES_DOT_KSM.find(
      nodeName => getParaId(nodeName) === parachainId && getRelayChainOf(nodeName) === relayChain
    ) ?? null

  if (node === null) {
    throw new InvalidParameterError('Node with specified paraId not found in destination location.')
  }

  return node
}

export const throwUnsupportedCurrency = (
  currency: TCurrencyInput,
  node: string,
  { isDestination } = { isDestination: false }
): never => {
  if ('location' in currency) {
    throw new InvalidCurrencyError(`
      Selected chain doesn't support location you provided. Maybe you meant custom location. If so, you need to use override option. Your selection should look like this: {location: Override(${JSON.stringify(currency.location)})}.`)
  }

  throw new InvalidCurrencyError(
    `${isDestination ? 'Destination' : 'Origin'} node ${node} does not support currency ${JSON.stringify(currency, replaceBigInt)}.`
  )
}

export { constructRelayToParaParameters } from './constructRelayToParaParameters'
