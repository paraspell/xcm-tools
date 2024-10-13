// Contains basic call formatting for different XCM Palletss

import type { TApiType, TResType, TTransferReturn } from '../../types'
import {
  type Extrinsic,
  type TSerializedApiCall,
  type TRelayToParaOptions,
  type TRelayToParaCommonOptions,
  type TSendOptionsCommon,
  type TSendOptions,
  type TNode
} from '../../types'
import {
  getNode,
  callPolkadotJsTxFunction,
  createApiInstanceForNode,
  determineRelayChain
} from '../../utils'
import { getRelayChainSymbol, hasSupportForAsset } from '../assets'
import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import { IncompatibleNodesError } from '../../errors'
import { checkKeepAlive } from './keepAlive/checkKeepAlive'
import { isTMultiLocation, resolveTNodeFromMultiLocation } from './utils'
import { getAssetBySymbolOrId } from '../assets/getAssetBySymbolOrId'
import type { ApiPromise } from '@polkadot/api'

const sendCommon = async <TApi extends TApiType>(
  options: TSendOptionsCommon<TApi>
): Promise<TTransferReturn> => {
  const {
    api,
    origin,
    currency,
    amount,
    address,
    destination,
    paraIdTo,
    destApiForKeepAlive,
    feeAsset,
    version,
    serializedApiCallEnabled = false
  } = options

  if ((!('multiasset' in currency) || 'multilocation' in currency) && amount === null) {
    throw new Error('Amount is required')
  }

  if ('id' in currency && typeof currency === 'number' && currency > Number.MAX_SAFE_INTEGER) {
    throw new InvalidCurrencyError(
      'The provided asset ID is larger than the maximum safe integer value. Please provide it as a string.'
    )
  }

  // Multi location checks
  if ('multilocation' in currency && (feeAsset === 0 || feeAsset !== undefined)) {
    throw new InvalidCurrencyError('Overrided single multi asset cannot be used with fee asset')
  }

  // Multi assets checks
  if ('multiasset' in currency) {
    if (amount !== null) {
      console.warn(
        'Amount is ignored when using overriding currency using multiple multi locations. Please set it to null.'
      )
    }

    if (currency.multiasset.length === 0) {
      throw new InvalidCurrencyError('Overrided multi assets cannot be empty')
    }

    if (currency.multiasset.length === 1 && (feeAsset === 0 || feeAsset !== undefined)) {
      throw new InvalidCurrencyError('Overrided single multi asset cannot be used with fee asset')
    }

    if (currency.multiasset.length > 1 && feeAsset === undefined) {
      throw new InvalidCurrencyError(
        'Overrided multi assets cannot be used without specifying fee asset'
      )
    }

    if (
      currency.multiasset.length > 1 &&
      feeAsset !== undefined &&
      ((feeAsset as number) < 0 || (feeAsset as number) >= currency.multiasset.length)
    ) {
      throw new InvalidCurrencyError(
        'Fee asset index is out of bounds. Please provide a valid index.'
      )
    }
  }

  if (destination === 'Ethereum' && origin !== 'AssetHubPolkadot') {
    throw new IncompatibleNodesError(
      'Transfers to Ethereum are only supported from AssetHubPolkadot.'
    )
  }

  const isMultiLocationDestination = typeof destination === 'object'

  const isBridge =
    (origin === 'AssetHubPolkadot' && destination === 'AssetHubKusama') ||
    (origin === 'AssetHubKusama' && destination === 'AssetHubPolkadot')
  const isRelayDestination = destination === undefined

  if (!isRelayDestination && !isMultiLocationDestination) {
    const originRelayChainSymbol = getRelayChainSymbol(origin)
    const destinationRelayChainSymbol = getRelayChainSymbol(destination)
    if (!isBridge && originRelayChainSymbol !== destinationRelayChainSymbol) {
      throw new IncompatibleNodesError()
    }
  }

  const originNode = getNode(origin)

  const assetCheckEnabled =
    'multilocation' in currency || 'multiasset' in currency || isBridge
      ? false
      : originNode.assetCheckEnabled

  const asset = assetCheckEnabled
    ? getAssetBySymbolOrId(
        origin,
        currency,
        isRelayDestination,
        isTMultiLocation(destination) ? undefined : destination
      )
    : null

  if (!isBridge && asset === null && assetCheckEnabled) {
    throw new InvalidCurrencyError(
      `Origin node ${origin} does not support currency ${JSON.stringify(currency)}.`
    )
  }

  if (
    !isBridge &&
    !isRelayDestination &&
    !isMultiLocationDestination &&
    asset?.symbol !== undefined &&
    assetCheckEnabled &&
    !('id' in currency) &&
    !hasSupportForAsset(destination, asset.symbol)
  ) {
    throw new InvalidCurrencyError(
      `Destination node ${destination} does not support currency ${JSON.stringify(currency)}.`
    )
  }

  const apiWithFallback = api ?? (await createApiInstanceForNode(origin))

  const amountStr = amount?.toString()

  if ('multilocation' in currency || 'multiasset' in currency) {
    console.warn('Keep alive check is not supported when using MultiLocation as currency.')
  } else if (typeof address === 'object') {
    console.warn('Keep alive check is not supported when using MultiLocation as address.')
  } else if (typeof destination === 'object') {
    console.warn('Keep alive check is not supported when using MultiLocation as destination.')
  } else if (origin === 'Ethereum' || destination === 'Ethereum') {
    console.warn('Keep alive check is not supported when using Ethereum as origin or destination.')
  } else {
    await checkKeepAlive({
      originApi: apiWithFallback,
      address,
      amount: amountStr ?? '',
      originNode: origin,
      destApi: destApiForKeepAlive,
      currencySymbol: asset?.symbol ?? ('symbol' in currency ? currency.symbol : undefined),
      destNode: destination
    })
  }

  const currencyStr =
    'symbol' in currency ? currency.symbol : 'id' in currency ? currency.id.toString() : undefined

  return originNode.transfer({
    api: apiWithFallback,
    currencySymbol: asset?.symbol ?? currencyStr,
    currencyId: asset?.assetId,
    amount: amountStr ?? '',
    address,
    destination,
    paraIdTo,
    overridedCurrencyMultiLocation:
      'multilocation' in currency
        ? currency.multilocation
        : 'multiasset' in currency
          ? currency.multiasset
          : undefined,
    feeAsset,
    version,
    serializedApiCallEnabled
  })
}

export const sendSerializedApiCall = async <TApi extends TApiType = ApiPromise>(
  options: TSendOptions<TApi>
): Promise<TSerializedApiCall> =>
  sendCommon({
    ...options,
    serializedApiCallEnabled: true
  }) as Promise<TSerializedApiCall>

/**
 * Transfers assets from parachain to another parachain or relay chain.
 * @param options - The transfer options.
 * @returns An extrinsic to be signed and sent.
 */
export const send = async <TApi extends TApiType = ApiPromise, TRes extends TResType = Extrinsic>(
  options: TSendOptions<TApi>
): Promise<TRes> => sendCommon(options) as Promise<TRes>

export const transferRelayToParaCommon = async <TApi extends TApiType>(
  options: TRelayToParaCommonOptions<TApi>
): Promise<TTransferReturn> => {
  const {
    api,
    destination,
    amount,
    address,
    paraIdTo,
    destApiForKeepAlive,
    version,
    serializedApiCallEnabled = false
  } = options
  const isMultiLocationDestination = typeof destination === 'object'
  const isAddressMultiLocation = typeof address === 'object'

  if (api === undefined && isMultiLocationDestination) {
    throw new Error('API is required when using MultiLocation as destination.')
  }

  const apiWithFallback =
    api ?? (await createApiInstanceForNode(determineRelayChain(destination as TNode)))

  const amountStr = amount.toString()

  if (isMultiLocationDestination) {
    console.warn('Keep alive check is not supported when using MultiLocation as destination.')
  } else if (isAddressMultiLocation) {
    console.warn('Keep alive check is not supported when using MultiLocation as address.')
  } else if (destination === 'Ethereum') {
    console.warn('Keep alive check is not supported when using Ethereum as destination.')
  } else {
    await checkKeepAlive({
      originApi: apiWithFallback,
      address,
      amount: amountStr,
      destApi: destApiForKeepAlive,
      currencySymbol: getRelayChainSymbol(destination),
      destNode: destination
    })
  }

  const serializedApiCall = getNode(
    isMultiLocationDestination ? resolveTNodeFromMultiLocation(destination) : destination
  ).transferRelayToPara({
    api: apiWithFallback,
    destination,
    address,
    amount: amountStr,
    paraIdTo,
    destApiForKeepAlive,
    version
  })

  if (serializedApiCallEnabled) {
    return serializedApiCall
  }

  return callPolkadotJsTxFunction(apiWithFallback, serializedApiCall)
}

/**
 * Transfers assets from relay chain to parachain.
 *
 * @param options - The transfer options.
 *
 * @returns An extrinsic to be signed and sent.
 */
export const transferRelayToPara = async <
  TApi extends TApiType = ApiPromise,
  TRes extends TResType = Extrinsic
>(
  options: TRelayToParaOptions<TApi>
): Promise<TRes> => transferRelayToParaCommon(options) as Promise<TRes>

export const transferRelayToParaSerializedApiCall = async <TApi extends TApiType = ApiPromise>(
  options: TRelayToParaOptions<TApi>
): Promise<TSerializedApiCall> =>
  transferRelayToParaCommon({
    ...options,
    serializedApiCallEnabled: true
  }) as Promise<TSerializedApiCall>
