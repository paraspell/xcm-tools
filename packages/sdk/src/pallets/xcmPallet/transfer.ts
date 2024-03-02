// Contains basic call formatting for different XCM Palletss

import {
  type Extrinsic,
  type TSerializedApiCall,
  type TRelayToParaOptions,
  type TRelayToParaCommonOptions,
  type TSendOptionsCommon,
  type TSendOptions
} from '../../types'
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

const sendCommon = async (options: TSendOptionsCommon): Promise<Extrinsic | TSerializedApiCall> => {
  const {
    api,
    origin,
    currency: currencySymbolOrId,
    amount,
    address,
    destination,
    paraIdTo,
    destApiForKeepAlive,
    serializedApiCallEnabled = false
  } = options

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

  const amountStr = amount.toString()

  await checkKeepAlive({
    originApi: apiWithFallback,
    address,
    amount: amountStr,
    originNode: origin,
    destApi: destApiForKeepAlive,
    currencySymbol: asset?.symbol ?? currencySymbolOrId.toString(),
    destNode: destination
  })

  const currencyId = assetCheckEnabled ? asset?.assetId : currencySymbolOrId.toString()

  return originNode.transfer({
    api: apiWithFallback,
    currencySymbol: asset?.symbol,
    currencyId,
    amount: amountStr,
    address,
    destination,
    paraIdTo,
    serializedApiCallEnabled
  })
}

export const sendSerializedApiCall = async (options: TSendOptions): Promise<TSerializedApiCall> => {
  return (await sendCommon({
    ...options,
    serializedApiCallEnabled: true
  })) as TSerializedApiCall
}

export const send = async (options: TSendOptions): Promise<Extrinsic> => {
  return (await sendCommon(options)) as Extrinsic
}

export const transferRelayToParaCommon = async (
  options: TRelayToParaCommonOptions
): Promise<Extrinsic | TSerializedApiCall | never> => {
  const {
    api,
    destination,
    amount,
    address,
    paraIdTo,
    destApiForKeepAlive,
    serializedApiCallEnabled = false
  } = options

  const currencySymbol = getRelayChainSymbol(destination)

  const relayNode = determineRelayChain(destination)
  const apiWithFallback = api ?? (await createApiInstanceForNode(relayNode))

  const amountStr = amount.toString()

  await checkKeepAlive({
    originApi: apiWithFallback,
    address,
    amount: amountStr,
    destApi: destApiForKeepAlive,
    currencySymbol,
    destNode: destination
  })

  const serializedApiCall = getNode(destination).transferRelayToPara({
    api: apiWithFallback,
    destination,
    address,
    amount: amountStr,
    paraIdTo,
    destApiForKeepAlive
  })

  if (serializedApiCallEnabled) {
    return serializedApiCall
  }

  return callPolkadotJsTxFunction(apiWithFallback, serializedApiCall)
}

export const transferRelayToPara = async (
  options: TRelayToParaOptions
): Promise<Extrinsic | never> => {
  return (await transferRelayToParaCommon(options)) as Extrinsic | never
}

export const transferRelayToParaSerializedApiCall = async (
  options: TRelayToParaOptions
): Promise<TSerializedApiCall> => {
  return (await transferRelayToParaCommon({
    ...options,
    serializedApiCallEnabled: true
  })) as TSerializedApiCall
}
