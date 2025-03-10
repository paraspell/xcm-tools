import { NODE_NAMES_DOT_KSM } from '../../constants'
import { InvalidCurrencyError } from '../../errors'
import { getParaId } from '../../nodes/config'
import type {
  OneKey,
  TAmount,
  TCurrencyInput,
  TNodePolkadotKusama,
  TRelaychain,
  TXcmVersioned
} from '../../types'
import { Parents, type TDestination, type TScenario, Version } from '../../types'
import { type TMultiAsset } from '../../types/TMultiAsset'
import type { TJunction } from '../../types/TMultiLocation'
import { type TMultiLocation } from '../../types/TMultiLocation'
import { determineRelayChain } from '../../utils'
import { createX1Payload } from '../../utils/createX1Payload'
import { findParachainJunction } from '../../utils/findParachainJunction'

export const isTMultiLocation = (value: unknown): value is TMultiLocation =>
  typeof value === 'object' && value !== null && 'parents' in value && 'interior' in value

export const isTMultiAsset = (value: unknown): value is TMultiAsset =>
  typeof value === 'object' && value !== null && 'id' in value && 'fun' in value

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

export const addXcmVersionHeader = <T, V extends Version>(obj: T, version: V) =>
  ({ [version]: obj }) as OneKey<V, T>

export const extractVersionFromHeader = <T>(versionHeader: OneKey<Version, T>): [Version, T] => {
  const keys = Object.keys(versionHeader) as Version[]
  if (keys.length !== 1) {
    throw new Error('Invalid version header: expected exactly one key.')
  }
  const version = keys[0]
  const value = versionHeader[version]
  if (value === undefined) {
    throw new Error('Invalid version header: value is undefined.')
  }
  return [version, value]
}

export const maybeOverrideMultiAssets = (
  version: Version,
  amount: TAmount,
  multiAssets: TMultiAsset[],
  overriddenCurrency?: TMultiLocation | TMultiAsset[]
) => {
  if (!overriddenCurrency) {
    return multiAssets
  }

  return isTMultiLocation(overriddenCurrency)
    ? [createMultiAsset(version, amount, overriddenCurrency)]
    : overriddenCurrency
}

export const createVersionedMultiAssets = (
  version: Version,
  amount: TAmount,
  multiLocation: TMultiLocation
) => {
  const multiAssets = createMultiAsset(version, amount, multiLocation)
  return addXcmVersionHeader([multiAssets], version)
}

export const createVersionedMultiLocation = (version: Version, multiLocation: TMultiLocation) => ({
  [version]: multiLocation
})

export const createPolkadotXcmHeader = (
  scenario: TScenario,
  version: Version,
  destination: TDestination,
  nodeId?: number,
  junction?: TJunction,
  parents?: Parents
): TXcmVersioned<TMultiLocation> => {
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

  const isMultiLocationDestination = isTMultiLocation(destination)
  return addXcmVersionHeader(
    isMultiLocationDestination
      ? destination
      : ({ parents: parentsResolved, interior } as TMultiLocation),
    version
  )
}

export const createBridgePolkadotXcmDest = (
  version: Version,
  ecosystem: 'Kusama' | 'Polkadot',
  destination: TDestination,
  nodeId?: number
): TXcmVersioned<TMultiLocation> => {
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
  const isMultiLocationDestination = isTMultiLocation(destination)
  return addXcmVersionHeader(isMultiLocationDestination ? destination : multiLocation, version)
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
