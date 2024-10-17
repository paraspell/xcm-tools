// Contains basic call formatting for different XCM Palletss

import type { TNodePolkadotKusama, TTransferReturn } from '../../types'
import {
  type TSerializedApiCall,
  type TRelayToParaOptions,
  type TSendOptions,
  type TNode
} from '../../types'
import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import { IncompatibleNodesError } from '../../errors'
import { checkKeepAlive } from './keepAlive/checkKeepAlive'
import { isTMultiLocation, resolveTNodeFromMultiLocation } from './utils'
import { getAssetBySymbolOrId } from '../assets/getAssetBySymbolOrId'
import { getDefaultPallet } from '../pallets'
import { getNativeAssets, getRelayChainSymbol, hasSupportForAsset } from '../assets'
import { getNode, determineRelayChain } from '../../utils'

const sendCommon = async <TApi, TRes>(
  options: TSendOptions<TApi, TRes>,
  serializedApiCallEnabled = false
): Promise<TTransferReturn<TRes>> => {
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
    version
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

  const originNode = getNode<TApi, TRes, typeof origin>(origin)

  const assetCheckEnabled =
    'multilocation' in currency || 'multiasset' in currency || isBridge
      ? false
      : originNode.assetCheckEnabled

  const isDestAssetHub = destination === 'AssetHubPolkadot' || destination === 'AssetHubKusama'

  const pallet = getDefaultPallet(origin as TNodePolkadotKusama)

  let asset

  // Transfers to AssetHub require the destination asset ID to be used
  if (!isBridge && isDestAssetHub && pallet === 'XTokens') {
    asset = getAssetBySymbolOrId(destination, currency, false, destination)

    if (
      'symbol' in currency &&
      getNativeAssets(destination).some(
        nativeAsset => nativeAsset.symbol.toLowerCase() === currency.symbol.toLowerCase()
      )
    ) {
      throw new InvalidCurrencyError(
        `${currency.symbol} is not supported for transfers to ${destination}.`
      )
    }

    if (assetCheckEnabled && asset === null) {
      throw new InvalidCurrencyError(
        `Destination node ${destination} does not support currency ${JSON.stringify(currency)}.`
      )
    }

    if (asset?.symbol && !hasSupportForAsset(origin, asset.symbol)) {
      throw new InvalidCurrencyError(
        `Origin node ${origin} does not support currency ${asset.symbol}.`
      )
    }
  } else {
    asset = assetCheckEnabled
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
  }

  await api.init(origin)

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
      originApi: api,
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
    api,
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
    destApiForKeepAlive,
    serializedApiCallEnabled
  })
}

export const sendSerializedApiCall = async <TApi, TRes>(
  options: TSendOptions<TApi, TRes>
): Promise<TSerializedApiCall> =>
  sendCommon<TApi, TRes>(options, true) as Promise<TSerializedApiCall>

export const send = async <TApi, TRes>(options: TSendOptions<TApi, TRes>): Promise<TRes> =>
  sendCommon(options) as Promise<TRes>

export const transferRelayToParaCommon = async <TApi, TRes>(
  options: TRelayToParaOptions<TApi, TRes>,
  serializedApiCallEnabled = false
): Promise<TTransferReturn<TRes>> => {
  const { api, destination, amount, address, paraIdTo, destApiForKeepAlive, version } = options
  const isMultiLocationDestination = typeof destination === 'object'
  const isAddressMultiLocation = typeof address === 'object'

  if (api === undefined && isMultiLocationDestination) {
    throw new Error('API is required when using MultiLocation as destination.')
  }

  await api.init(determineRelayChain(destination as TNode))

  const amountStr = amount.toString()

  if (isMultiLocationDestination) {
    console.warn('Keep alive check is not supported when using MultiLocation as destination.')
  } else if (isAddressMultiLocation) {
    console.warn('Keep alive check is not supported when using MultiLocation as address.')
  } else if (destination === 'Ethereum') {
    console.warn('Keep alive check is not supported when using Ethereum as destination.')
  } else {
    await checkKeepAlive({
      originApi: api,
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
    api,
    destination,
    address,
    amount: amountStr,
    paraIdTo,
    destApiForKeepAlive,
    version
  })

  if (serializedApiCallEnabled) {
    // Keep compatibility with old serialized call type
    return {
      ...serializedApiCall,
      parameters: Object.values(serializedApiCall.parameters)
    }
  }

  return api.callTxMethod(serializedApiCall)
}

export const transferRelayToPara = async <TApi, TRes>(
  options: TRelayToParaOptions<TApi, TRes>
): Promise<TRes> => transferRelayToParaCommon(options) as Promise<TRes>

export const transferRelayToParaSerializedApiCall = async <TApi, TRes>(
  options: TRelayToParaOptions<TApi, TRes>
): Promise<TSerializedApiCall> =>
  transferRelayToParaCommon<TApi, TRes>(options, true) as Promise<TSerializedApiCall>
