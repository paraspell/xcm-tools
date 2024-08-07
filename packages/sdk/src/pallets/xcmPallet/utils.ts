/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { type BN } from '@polkadot/util'
import {
  Version,
  Parents,
  type TMultiLocationHeader,
  type TScenario,
  type Extrinsic,
  type TRelayToParaInternalOptions,
  type TDestination,
  type TNode,
  type TCurrencySelectionHeaderArr,
  TCurrencySpecifier
} from '../../types'
import { createX1Payload, generateAddressPayload } from '../../utils'
import { getParaId, getTNode } from '../assets'
import { TJunction, type TMultiLocation } from '../../types/TMultiLocation'
import { type TMultiAsset } from '../../types/TMultiAsset'

export const constructRelayToParaParameters = (
  { api, destination, address, amount, paraIdTo }: TRelayToParaInternalOptions,
  version: Version,
  includeFee = false
): any[] => {
  const paraId =
    destination !== undefined && typeof destination !== 'object'
      ? (paraIdTo ?? getParaId(destination))
      : undefined

  const parameters: any[] = [
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

export const isTMulti = (value: any): value is TMultiLocation => {
  return (value && typeof value === 'object') || Array.isArray(value)
}

export const isTMultiLocation = (value: any): value is TMultiLocation => {
  return value && typeof value.parents !== 'undefined' && typeof value.interior !== 'undefined'
}

export const isTCurrencySpecifier = (value: any): value is TCurrencySpecifier => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  return (
    ('symbol' in value && typeof value.symbol === 'string') ||
    ('id' in value &&
      (typeof value.id === 'string' ||
        typeof value.id === 'number' ||
        typeof value.id === 'bigint'))
  )
}

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
  interior: any = 'Here'
): TCurrencySelectionHeaderArr => {
  if (!overriddenCurrency) {
    return {
      [version]: [
        {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

export const calculateTransactionFee = async (tx: Extrinsic, address: string): Promise<BN> => {
  const { partialFee } = await tx.paymentInfo(address)
  return partialFee.toBn()
}

// TODO: Refactor this function to eliminate the any type
const findParachainJunction = (multilocation: TMultiLocation): number | null => {
  const { interior }: any = multilocation
  for (const key in interior) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const junctions = interior[key]
    if (Array.isArray(junctions)) {
      for (const junction of junctions) {
        if ('Parachain' in junction) {
          return Number(junction.Parachain)
        }
      }
    } else if (junctions !== undefined && 'Parachain' in junctions) {
      return Number(junctions.Parachain)
    }
  }
  return null
}

export const resolveTNodeFromMultiLocation = (multiLocation: TMultiLocation): TNode => {
  const parachainId = findParachainJunction(multiLocation)
  if (parachainId === null) {
    throw new Error('Parachain ID not found in destination multi location.')
  }

  const node = getTNode(parachainId)

  if (node === null) {
    throw new Error('Node with specified paraId not found in destination multi location.')
  }

  return node
}
