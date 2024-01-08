// Contains basic call formatting for different XCM Palletss

import type { ApiPromise } from '@polkadot/api'
import { type Extrinsic, type TNode, type TSerializedApiCall } from '../../types'
import { getNode, callPolkadotJsTxFunction } from '../../utils'
import { getRelayChainSymbol, hasSupportForAsset } from '../assets'
import { getAssetBySymbolOrId } from '../assets/assetsUtils'
import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import { IncompatibleNodesError } from '../../errors'
import { checkKeepAlive } from './keepAlive'

const sendCommon = async (
  api: ApiPromise,
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

  if (asset === null && originNode.assetCheckEnabled) {
    throw new InvalidCurrencyError(
      `Origin node ${origin} does not support currency or currencyId ${currencySymbolOrId}.`
    )
  }

  if (
    destination !== undefined &&
    asset?.symbol !== undefined &&
    getNode(destination).assetCheckEnabled &&
    !hasSupportForAsset(destination, asset.symbol)
  ) {
    throw new InvalidCurrencyError(
      `Destination node ${destination} does not support currency or currencyId ${currencySymbolOrId}.`
    )
  }

  await checkKeepAlive({
    address: to,
    amount,
    originNode: origin,
    destApi: destApiForKeepAlive,
    currencySymbol: asset?.symbol,
    destNode: destination
  })

  const currencyId = originNode.assetCheckEnabled ? asset?.assetId : currencySymbolOrId.toString()

  return originNode.transfer(
    api,
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
  api: ApiPromise,
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

export async function send(
  api: ApiPromise,
  origin: TNode,
  currencySymbolOrId: string | number | bigint,
  amount: string | number | bigint,
  to: string,
  destination?: TNode,
  paraIdTo?: number,
  destApiForKeepAlive?: ApiPromise
): Promise<Extrinsic> {
  return (await sendCommon(
    api,
    origin,
    currencySymbolOrId,
    amount.toString(),
    to,
    destination,
    paraIdTo,
    destApiForKeepAlive
  )) as Extrinsic
}

export const transferRelayToParaCommon = async (
  api: ApiPromise,
  destination: TNode,
  amount: string,
  address: string,
  paraIdTo?: number,
  destApiForKeepAlive?: ApiPromise,
  serializedApiCallEnabled = false
): Promise<Extrinsic | TSerializedApiCall | never> => {
  const currencySymbol = getRelayChainSymbol(destination)
  await checkKeepAlive({
    address,
    amount,
    destApi: destApiForKeepAlive,
    currencySymbol,
    destNode: destination
  })

  const serializedApiCall = getNode(destination).transferRelayToPara({
    api,
    destination,
    address,
    amount,
    paraIdTo,
    destApiForKeepAlive
  })

  if (serializedApiCallEnabled) {
    return serializedApiCall
  }

  return callPolkadotJsTxFunction(api, serializedApiCall)
}

export const transferRelayToPara = async (
  api: ApiPromise,
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
  api: ApiPromise,
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
