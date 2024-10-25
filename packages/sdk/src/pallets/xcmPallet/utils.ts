import {
  Version,
  Parents,
  type TMultiLocationHeader,
  type TScenario,
  type TRelayToParaInternalOptions,
  type TDestination,
  type TNode,
  type TCurrencySelectionHeaderArr
} from '../../types'
import { getParaId } from '../assets'
import type { Junctions, TJunction } from '../../types/TMultiLocation'
import { type TMultiLocation } from '../../types/TMultiLocation'
import { type TMultiAsset } from '../../types/TMultiAsset'
import { findParachainJunction } from './findParachainJunction'
import { generateAddressPayload } from '../../utils/generateAddressPayload'
import { createX1Payload } from '../../utils/createX1Payload'
import { NODE_NAMES } from '../../maps/consts'

export const constructRelayToParaParameters = (
  { api, destination, address, amount, paraIdTo }: TRelayToParaInternalOptions,
  version: Version,
  includeFee = false
): unknown[] => {
  const paraId =
    destination !== undefined && typeof destination !== 'object'
      ? (paraIdTo ?? getParaId(destination))
      : undefined

  const parameters: unknown[] = [
    createPolkadotXcmHeader('RelayToPara', version, destination, paraId),
    generateAddressPayload(api, 'RelayToPara', null, address, version, paraId),
    createCurrencySpec(amount, version, Parents.ZERO),
    0
  ]
  if (includeFee) {
    parameters.push('Unlimited')
  }
  return parameters
}

export const isTMultiLocation = (value: unknown): value is TMultiLocation =>
  typeof value === 'object' && value !== null && 'parents' in value && 'interior' in value

export const createBridgeCurrencySpec = (
  amount: string,
  ecosystem: 'Polkadot' | 'Kusama'
): TCurrencySelectionHeaderArr => {
  return {
    [Version.V4]: [
      {
        id: {
          parents: Parents.TWO,
          interior: {
            X1: [
              {
                GlobalConsensus: ecosystem
              }
            ]
          }
        },
        fun: {
          Fungible: amount
        }
      }
    ]
  }
}

export const createCurrencySpec = (
  amount: string,
  version: Version,
  parents: Parents,
  overriddenCurrency?: TMultiLocation | TMultiAsset[],
  interior: Junctions | 'Here' = 'Here'
): TCurrencySelectionHeaderArr => {
  if (!overriddenCurrency) {
    return {
      [version]: [
        {
          id: version === Version.V4 ? { parents, interior } : { Concrete: { parents, interior } },
          fun: { Fungible: amount }
        }
      ]
    }
  }

  return isTMultiLocation(overriddenCurrency)
    ? {
        [version]: [
          {
            id: version === Version.V4 ? overriddenCurrency : { Concrete: overriddenCurrency },
            fun: { Fungible: amount }
          }
        ]
      }
    : // It must be TMultiAsset if not TMultiLocation
      {
        [version]: overriddenCurrency
      }
}

export const createPolkadotXcmHeader = (
  scenario: TScenario,
  version: Version,
  destination?: TDestination,
  nodeId?: number,
  junction?: TJunction,
  parents?: Parents
): TMultiLocationHeader => {
  const parentsResolved = parents ?? (scenario === 'RelayToPara' ? Parents.ZERO : Parents.ONE)
  const interior =
    scenario === 'ParaToRelay'
      ? 'Here'
      : createX1Payload(
          version,
          junction ?? {
            Parachain: nodeId
          }
        )

  const isMultiLocationDestination = typeof destination === 'object'
  return {
    [version]: isMultiLocationDestination
      ? destination
      : {
          parents: parentsResolved,
          interior
        }
  }
}

export const createBridgePolkadotXcmDest = (
  version: Version,
  ecosystem: 'Kusama' | 'Polkadot',
  destination?: TDestination,
  nodeId?: number
): TMultiLocationHeader => {
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
  const isMultiLocationDestination = typeof destination === 'object'
  return {
    [version]: isMultiLocationDestination ? destination : multiLocation
  }
}

export const resolveTNodeFromMultiLocation = (multiLocation: TMultiLocation): TNode => {
  const parachainId = findParachainJunction(multiLocation)
  if (parachainId === null) {
    throw new Error('Parachain ID not found in destination multi location.')
  }

  const node = NODE_NAMES.find(nodeName => getParaId(nodeName) === parachainId) ?? null

  if (node === null) {
    throw new Error('Node with specified paraId not found in destination multi location.')
  }

  return node
}
