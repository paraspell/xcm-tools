import type { TAmount, TRelaychain, TNodePolkadotKusama, TCurrencyInput } from '../../types'
import {
  Version,
  Parents,
  type TMultiLocationHeader,
  type TScenario,
  type TDestination,
  type TCurrencySelectionHeaderArr
} from '../../types'
import type { TJunctions, TJunction } from '../../types/TMultiLocation'
import { type TMultiLocation } from '../../types/TMultiLocation'
import { type TMultiAsset } from '../../types/TMultiAsset'
import { findParachainJunction } from './findParachainJunction'
import { createX1Payload } from '../../utils/createX1Payload'
import { NODE_NAMES_DOT_KSM } from '../../maps/consts'
import { InvalidCurrencyError } from '../../errors'
import { getParaId } from '../../nodes/config'
import { determineRelayChain } from '../../utils'

export const isTMultiLocation = (value: unknown): value is TMultiLocation =>
  typeof value === 'object' && value !== null && 'parents' in value && 'interior' in value

export const isTMultiAsset = (value: unknown): value is TMultiAsset =>
  typeof value === 'object' && value !== null && 'id' in value && 'fun' in value

export const createBridgeCurrencySpec = (
  amount: TAmount,
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
          Fungible: amount.toString()
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
  interior: TJunctions | 'Here' = 'Here'
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
  destination: TDestination,
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
  destination: TDestination,
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
  relayChain: TRelaychain,
  multiLocation: TMultiLocation
): TNodePolkadotKusama => {
  const parachainId = findParachainJunction(multiLocation)
  if (parachainId === null) {
    throw new Error('Parachain ID not found in destination multi location.')
  }

  const node =
    NODE_NAMES_DOT_KSM.find(
      nodeName =>
        getParaId(nodeName) === parachainId && determineRelayChain(nodeName) === relayChain
    ) ?? null

  if (node === null) {
    throw new Error('Node with specified paraId not found in destination multi location.')
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
    `${isDestination ? 'Destination' : 'Origin'} node ${node} does not support currency ${JSON.stringify(currency)}.`
  )
}

export { constructRelayToParaParameters } from './constructRelayToParaParameters'
