import { InvalidCurrencyError, type TCurrencyInput } from '@paraspell/assets'
import type {
  TJunction,
  TLocation,
  TParachain,
  TRelaychain,
  TSubstrateChain,
  Version
} from '@paraspell/sdk-common'
import { getJunctionValue, PARACHAINS, replaceBigInt } from '@paraspell/sdk-common'
import { isTLocation, Parents } from '@paraspell/sdk-common'

import { getParaId } from '../../chains/config'
import { InvalidParameterError } from '../../errors'
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
  const scenario = resolveScenario(origin, destination)
  const parentsResolved = parents ?? (scenario === 'RelayToPara' ? Parents.ZERO : Parents.ONE)
  const interior =
    scenario === 'ParaToRelay'
      ? 'Here'
      : createX1Payload(version, junction ?? { Parachain: chainId })

  const isLocationDestination = isTLocation(destination)

  return isLocationDestination ? destination : ({ parents: parentsResolved, interior } as TLocation)
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

export const createBridgeDestination = (
  ecosystem: 'Kusama' | 'Polkadot',
  destination: TDestination,
  chainId?: number
): TLocation => {
  const location: TLocation = {
    parents: Parents.TWO,
    interior: {
      X2: [
        {
          GlobalConsensus: ecosystem
        },
        {
          Parachain: chainId
        }
      ]
    }
  }
  return isTLocation(destination) ? destination : location
}

export const resolveTChainFromLocation = (
  relaychain: TRelaychain,
  location: TLocation
): TParachain => {
  const parachainId = getJunctionValue(location, 'Parachain')
  if (parachainId === undefined) {
    throw new InvalidParameterError('Parachain ID not found in destination location.')
  }

  const chain =
    PARACHAINS.find(
      chain => getParaId(chain) === parachainId && getRelayChainOf(chain) === relaychain
    ) ?? null

  if (chain === null) {
    throw new InvalidParameterError(
      'Chain with specified paraId not found in destination location.'
    )
  }

  return chain
}

export const throwUnsupportedCurrency = (
  currency: TCurrencyInput,
  chain: string,
  { isDestination } = { isDestination: false }
): never => {
  if ('location' in currency) {
    throw new InvalidCurrencyError(`
      Selected chain doesn't support location you provided. Maybe you meant custom location. If so, you need to use override option. Your selection should look like this: {location: Override(${JSON.stringify(currency.location)})}.`)
  }

  throw new InvalidCurrencyError(
    `${isDestination ? 'Destination' : 'Origin'} chain ${chain} does not support currency ${JSON.stringify(currency, replaceBigInt)}.`
  )
}

export { constructRelayToParaParameters } from './constructRelayToParaParameters'
