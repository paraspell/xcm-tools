import type { TAmount, TCurrencyInput, TNodePolkadotKusama } from '../../types'
import {
  Version,
  Parents,
  type TMultiLocationHeader,
  type TScenario,
  type TDestination,
  type TCurrencySelectionHeaderArr
} from '../../types'
import type { Junctions, TJunction } from '../../types/TMultiLocation'
import { type TMultiLocation } from '../../types/TMultiLocation'
import { type TMultiAsset } from '../../types/TMultiAsset'
import { findParachainJunction } from './findParachainJunction'
import { createX1Payload } from '../../utils/createX1Payload'
import { NODE_NAMES_DOT_KSM } from '../../maps/consts'
import { InvalidCurrencyError } from '../../errors'
import { getParaId } from '../../nodes/config'

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

export const createMultiAsset = (
  version: Version,
  amount: TAmount,
  multiLocation: TMultiLocation
): TMultiAsset => {
  if (version === Version.V4) {
    return {
      id: multiLocation,
      fun: { Fungible: amount }
    }
  }

  return {
    id: { Concrete: multiLocation },
    fun: { Fungible: amount }
  }
}

export const createCurrencySpec = (
  amount: TAmount,
  version: Version,
  parents: Parents,
  overriddenCurrency?: TMultiLocation | TMultiAsset[],
  interior: Junctions | 'Here' = 'Here'
): TCurrencySelectionHeaderArr => {
  if (!overriddenCurrency) {
    return {
      [version]: [
        createMultiAsset(version, amount, {
          parents,
          interior
        })
      ]
    }
  }

  return isTMultiLocation(overriddenCurrency)
    ? {
        [version]: [createMultiAsset(version, amount, overriddenCurrency)]
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

export const resolveTNodeFromMultiLocation = (
  multiLocation: TMultiLocation
): TNodePolkadotKusama => {
  const parachainId = findParachainJunction(multiLocation)
  if (parachainId === null) {
    throw new Error('Parachain ID not found in destination multi location.')
  }

  const node = NODE_NAMES_DOT_KSM.find(nodeName => getParaId(nodeName) === parachainId) ?? null

  if (node === null) {
    throw new Error('Node with specified paraId not found in destination multi location.')
  }

  return node
}

export const throwUnsupportedCurrency = (
  currency: TCurrencyInput,
  node: TNodePolkadotKusama,
  { isDestination } = { isDestination: false }
) => {
  if ('multilocation' in currency) {
    throw new InvalidCurrencyError(`
      Selected chain doesn't support multilocation you provided. Maybe you meant custom multilocation. If so, you need to use override option. Your selection should look like this: {multilocation: Override(${JSON.stringify(currency.multilocation)})}.`)
  }

  throw new InvalidCurrencyError(
    `${isDestination ? 'Destination' : 'Origin'} node ${node} does not support currency ${JSON.stringify(currency)}.`
  )
}

export { constructRelayToParaParameters } from './constructRelayToParaParameters'
