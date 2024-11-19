// Contains basic call formatting for different XCM Palletss

import type { TNativeAsset, TTransferReturn } from '../../types'
import {
  type TSerializedApiCall,
  type TRelayToParaOptions,
  type TSendOptions,
  type TNode
} from '../../types'
import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import { IncompatibleNodesError } from '../../errors'
import { checkKeepAlive } from './keepAlive/checkKeepAlive'
import { isTMultiLocation, resolveTNodeFromMultiLocation, throwUnsupportedCurrency } from './utils'
import { getAssetBySymbolOrId } from '../assets/getAssetBySymbolOrId'
import { getDefaultPallet } from '../pallets'
import { getNativeAssets, getRelayChainSymbol, hasSupportForAsset } from '../assets'
import { getNode, determineRelayChain } from '../../utils'
import { isSymbolSpecifier } from '../../utils/assets/isSymbolSpecifier'
import { isOverrideMultiLocationSpecifier } from '../../utils/multiLocation/isOverrideMultiLocationSpecifier'
import { isPjsClient } from '../../utils/isPjsClient'

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
    version,
    ahAddress
  } = options

  if ((!('multiasset' in currency) || 'multilocation' in currency) && amount === null) {
    throw new Error('Amount is required')
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

  if (destination === 'Ethereum' && origin !== 'AssetHubPolkadot' && origin !== 'Hydration') {
    throw new IncompatibleNodesError(
      'Transfers to Ethereum are only supported from AssetHubPolkadot and Hydration.'
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
    'multiasset' in currency ||
    ('multilocation' in currency && isOverrideMultiLocationSpecifier(currency.multilocation)) ||
    isBridge
      ? false
      : originNode.assetCheckEnabled

  const isDestAssetHub = destination === 'AssetHubPolkadot' || destination === 'AssetHubKusama'

  const pallet = getDefaultPallet(origin)

  const isBifrost = origin === 'BifrostPolkadot' || origin === 'BifrostKusama'

  if (!assetCheckEnabled && 'symbol' in currency && isSymbolSpecifier(currency.symbol)) {
    throw new InvalidCurrencyError(
      'Symbol specifier is not supported when asset check is disabled. Please use normal symbol instead.'
    )
  }

  if (!assetCheckEnabled && 'id' in currency) {
    throw new InvalidCurrencyError(
      'Asset ID is not supported when asset check is disabled. Please use normal symbol instead'
    )
  }

  const asset = assetCheckEnabled
    ? getAssetBySymbolOrId(
        origin,
        currency,
        isRelayDestination
          ? determineRelayChain(origin)
          : !isTMultiLocation(destination)
            ? destination
            : null
      )
    : null

  if (!isBridge && isDestAssetHub && pallet === 'XTokens' && !isBifrost) {
    let nativeAssets = getNativeAssets(destination)

    if (origin === 'Hydration') {
      nativeAssets = nativeAssets.filter(nativeAsset => nativeAsset.symbol !== 'DOT')
    }

    if (
      'symbol' in currency &&
      nativeAssets.some(
        nativeAsset => nativeAsset.symbol.toLowerCase() === asset?.symbol?.toLowerCase()
      )
    ) {
      throw new InvalidCurrencyError(
        `${JSON.stringify(asset?.symbol)} is not supported for transfers to ${destination}.`
      )
    }
  }

  if (!isBridge && asset === null && assetCheckEnabled) {
    throwUnsupportedCurrency(currency, origin)
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

  await api.init(origin)

  try {
    const amountStr = amount?.toString()

    if ('multilocation' in currency || 'multiasset' in currency) {
      console.warn('Keep alive check is not supported when using MultiLocation as currency.')
    } else if (typeof address === 'object') {
      console.warn('Keep alive check is not supported when using MultiLocation as address.')
    } else if (typeof destination === 'object') {
      console.warn('Keep alive check is not supported when using MultiLocation as destination.')
    } else if (destination === 'Ethereum') {
      console.warn(
        'Keep alive check is not supported when using Ethereum as origin or destination.'
      )
    } else if (!asset) {
      console.warn('Keep alive check is not supported when asset check is disabled.')
    } else {
      await checkKeepAlive({
        originApi: api,
        address,
        amount: amountStr ?? '',
        originNode: origin,
        destApi: destApiForKeepAlive,
        asset,
        destNode: destination
      })
    }

    // In case asset check is disabled, we create asset object from currency symbol
    const resolvedAsset =
      asset ??
      ({
        symbol: 'symbol' in currency ? currency.symbol : undefined
      } as TNativeAsset)

    return originNode.transfer({
      api,
      asset: resolvedAsset,
      amount: amountStr ?? '',
      address,
      destination,
      paraIdTo,
      overridedCurrencyMultiLocation:
        'multilocation' in currency && isOverrideMultiLocationSpecifier(currency.multilocation)
          ? currency.multilocation.value
          : 'multiasset' in currency
            ? currency.multiasset
            : undefined,
      feeAsset,
      version,
      destApiForKeepAlive,
      serializedApiCallEnabled,
      ahAddress
    })
  } finally {
    if (isPjsClient(api)) {
      await api.disconnect()
    }
  }
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

  try {
    const amountStr = amount.toString()

    if (isMultiLocationDestination) {
      console.warn('Keep alive check is not supported when using MultiLocation as destination.')
    } else if (isAddressMultiLocation) {
      console.warn('Keep alive check is not supported when using MultiLocation as address.')
    } else {
      await checkKeepAlive({
        originApi: api,
        address,
        amount: amountStr,
        destApi: destApiForKeepAlive,
        asset: { symbol: getRelayChainSymbol(destination) },
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
  } finally {
    if (isPjsClient(api)) {
      await api.disconnect()
    }
  }
}

export const transferRelayToPara = async <TApi, TRes>(
  options: TRelayToParaOptions<TApi, TRes>
): Promise<TRes> => transferRelayToParaCommon(options) as Promise<TRes>

export const transferRelayToParaSerializedApiCall = async <TApi, TRes>(
  options: TRelayToParaOptions<TApi, TRes>
): Promise<TSerializedApiCall> =>
  transferRelayToParaCommon<TApi, TRes>(options, true) as Promise<TSerializedApiCall>
