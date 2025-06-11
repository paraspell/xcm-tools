import { InvalidCurrencyError, type TCurrencyInput } from '@paraspell/assets'
import type { TJunction, TMultiLocation, Version } from '@paraspell/sdk-common'
import { replaceBigInt } from '@paraspell/sdk-common'
import { isTMultiLocation, Parents } from '@paraspell/sdk-common'
import { NODE_NAMES_DOT_KSM, type TNodePolkadotKusama } from '@paraspell/sdk-common'

import { InvalidParameterError } from '../../errors'
import { getParaId } from '../../nodes/config'
import type { TRelaychain, TXcmVersioned } from '../../types'
import { type TDestination, type TScenario } from '../../types'
import { addXcmVersionHeader, createX1Payload, determineRelayChain } from '../../utils'
import { findParachainJunction } from '../../utils/findParachainJunction'

export const createDestination = (
  scenario: TScenario,
  version: Version,
  destination: TDestination,
  nodeId?: number,
  junction?: TJunction,
  parents?: Parents
): TMultiLocation => {
  const parentsResolved = parents ?? (scenario === 'RelayToPara' ? Parents.ZERO : Parents.ONE)
  const interior =
    scenario === 'ParaToRelay'
      ? 'Here'
      : createX1Payload(version, junction ?? { Parachain: nodeId })

  const isMultiLocationDestination = isTMultiLocation(destination)

  return isMultiLocationDestination
    ? destination
    : ({ parents: parentsResolved, interior } as TMultiLocation)
}

export const createVersionedDestination = (
  scenario: TScenario,
  version: Version,
  destination: TDestination,
  nodeId?: number,
  junction?: TJunction,
  parents?: Parents
): TXcmVersioned<TMultiLocation> => {
  const plainDestination = createDestination(
    scenario,
    version,
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
): TMultiLocation => {
  const multiLocation: TMultiLocation = {
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
  return isTMultiLocation(destination) ? destination : multiLocation
}

export const resolveTNodeFromMultiLocation = (
  relayChain: TRelaychain,
  multiLocation: TMultiLocation
): TNodePolkadotKusama => {
  const parachainId = findParachainJunction(multiLocation)
  if (parachainId === null) {
    throw new InvalidParameterError('Parachain ID not found in destination multi location.')
  }

  const node =
    NODE_NAMES_DOT_KSM.find(
      nodeName =>
        getParaId(nodeName) === parachainId && determineRelayChain(nodeName) === relayChain
    ) ?? null

  if (node === null) {
    throw new InvalidParameterError(
      'Node with specified paraId not found in destination multi location.'
    )
  }

  return node
}

export const throwUnsupportedCurrency = (
  currency: TCurrencyInput,
  node: string,
  { isDestination } = { isDestination: false }
): never => {
  if ('multilocation' in currency) {
    throw new InvalidCurrencyError(`
      Selected chain doesn't support multilocation you provided. Maybe you meant custom multilocation. If so, you need to use override option. Your selection should look like this: {multilocation: Override(${JSON.stringify(currency.multilocation)})}.`)
  }

  throw new InvalidCurrencyError(
    `${isDestination ? 'Destination' : 'Origin'} node ${node} does not support currency ${JSON.stringify(currency, replaceBigInt)}.`
  )
}

export { constructRelayToParaParameters } from './constructRelayToParaParameters'
