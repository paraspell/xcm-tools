// Contains basic call formatting for different XCM Palletss

import type { ApiPromise } from '@polkadot/api'
import { type Extrinsic, type TNode, type TSerializedApiCall } from '../../types'
import {
  getNode,
  callPolkadotJsTxFunction,
  createApiInstanceForNode,
  determineRelayChain
} from '../../utils'
import { getRelayChainSymbol, hasSupportForAsset } from '../assets'
import { getAssetBySymbolOrId } from '../assets/assetsUtils'
import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import { IncompatibleNodesError } from '../../errors'
import { checkKeepAlive } from './keepAlive'

const sendCommon = async (
  api: ApiPromise | undefined,
  origin: TNode,
  currencySymbolOrId: string | number | bigint,
  amount: string,
  to: string,
  destination?: TNode,
  paraIdTo?: number,
  destApiForKeepAlive?: ApiPromise,
  serializedApiCallEnabled = false
): Promise<Extrinsic | TSerializedApiCall> => {
  if (typeof currencySymbolOrId === 'number' && currencySymbolOrId > Number.MAX_SAFE_INTEGER) {
    throw new InvalidCurrencyError(
      'The provided asset ID is larger than the maximum safe integer value. Please provide it as a string.'
    )
  }

  const asset = getAssetBySymbolOrId(origin, currencySymbolOrId.toString())

  if (destination !== undefined) {
    const originRelayChainSymbol = getRelayChainSymbol(origin)
    const destinationRelayChainSymbol = getRelayChainSymbol(destination)
    if (originRelayChainSymbol !== destinationRelayChainSymbol) {
      throw new IncompatibleNodesError()
    }
  }

  const originNode = getNode(origin)

  const assetCheckEnabled =
    destination === 'AssetHubKusama' || destination === 'AssetHubPolkadot'
      ? false
      : originNode.assetCheckEnabled

  if (asset === null && assetCheckEnabled) {
    throw new InvalidCurrencyError(
      `Origin node ${origin} does not support currency or currencyId ${currencySymbolOrId}.`
    )
  }

  if (
    destination !== undefined &&
    asset?.symbol !== undefined &&
    assetCheckEnabled &&
    !hasSupportForAsset(destination, asset.symbol)
  ) {
    throw new InvalidCurrencyError(
      `Destination node ${destination} does not support currency or currencyId ${currencySymbolOrId}.`
    )
  }

  const apiWithFallback = api ?? (await createApiInstanceForNode(origin))

  await checkKeepAlive({
    originApi: apiWithFallback,
    address: to,
    amount,
    originNode: origin,
    destApi: destApiForKeepAlive,
    currencySymbol: asset?.symbol ?? currencySymbolOrId.toString(),
    destNode: destination
  })

  const currencyId = assetCheckEnabled ? asset?.assetId : currencySymbolOrId.toString()

  return originNode.transfer(
    apiWithFallback,
    asset?.symbol,
    currencyId,
    amount,
    to,
    destination,
    paraIdTo,
    serializedApiCallEnabled
  )
}

export const sendSerializedApiCall = async (
  api: ApiPromise | undefined,
  origin: TNode,
  currencySymbolOrId: string | number | bigint,
  amount: string | number | bigint,
  to: string,
  destination?: TNode,
  paraIdTo?: number,
  destApiForKeepAlive?: ApiPromise
): Promise<TSerializedApiCall> => {
  return (await sendCommon(
    api,
    origin,
    currencySymbolOrId,
    amount.toString(),
    to,
    destination,
    paraIdTo,
    destApiForKeepAlive,
    true
  )) as TSerializedApiCall
}

export const send = async (
  api: ApiPromise | undefined,
  origin: TNode,
  currencySymbolOrId: string | number | bigint,
  amount: string | number | bigint,
  to: string,
  destination?: TNode,
  paraIdTo?: number,
  destApiForKeepAlive?: ApiPromise
): Promise<Extrinsic> =>
  (await sendCommon(
    api,
    origin,
    currencySymbolOrId,
    amount.toString(),
    to,
    destination,
    paraIdTo,
    destApiForKeepAlive
  )) as Extrinsic

export const transferRelayToParaCommon = async (
  api: ApiPromise | undefined,
  destination: TNode,
  amount: string,
  address: string,
  paraIdTo?: number,
  destApiForKeepAlive?: ApiPromise,
  serializedApiCallEnabled = false
): Promise<Extrinsic | TSerializedApiCall | never> => {
  const currencySymbol = getRelayChainSymbol(destination)

  const relayNode = determineRelayChain(destination)
  const apiWithFallback = api ?? (await createApiInstanceForNode(relayNode))

  await checkKeepAlive({
    originApi: apiWithFallback,
    address,
    amount,
    destApi: destApiForKeepAlive,
    currencySymbol,
    destNode: destination
  })

  const serializedApiCall = getNode(destination).transferRelayToPara({
    api: apiWithFallback,
    destination,
    address,
    amount,
    paraIdTo,
    destApiForKeepAlive
  })

  if (serializedApiCallEnabled) {
    return serializedApiCall
  }

  return callPolkadotJsTxFunction(apiWithFallback, serializedApiCall)
}

export const transferRelayToPara = async (
  api: ApiPromise | undefined,
  destination: TNode,
  amount: string | number | bigint,
  to: string,
  paraIdTo?: number,
  destApiForKeepAlive?: ApiPromise
): Promise<Extrinsic | never> => {
  return (await transferRelayToParaCommon(
    api,
    destination,
    amount.toString(),
    to,
    paraIdTo,
    destApiForKeepAlive
  )) as Extrinsic | never
}

export const transferRelayToParaSerializedApiCall = async (
  api: ApiPromise | undefined,
  destination: TNode,
  amount: string | number | bigint,
  to: string,
  paraIdTo?: number,
  destApiForKeepAlive?: ApiPromise
): Promise<TSerializedApiCall> =>
  (await transferRelayToParaCommon(
    api,
    destination,
    amount.toString(),
    to,
    paraIdTo,
    destApiForKeepAlive,
    true
  )) as TSerializedApiCall
