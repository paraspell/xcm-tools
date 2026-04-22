// Contains basic call formatting for different XCM Palletss

import type { TAssetInfo } from '@paraspell/assets'
import { normalizeLocation } from '@paraspell/assets'
import { isSubstrateBridge, isTLocation, Parents } from '@paraspell/sdk-common'

import { MIN_AMOUNT, TX_CLIENT_TIMEOUT_MS } from '../constants'
import type { TSubstrateTransferOptions } from '../types'
import {
  abstractDecimals,
  getChain,
  pickCompatibleXcmVersion,
  validateAddress,
  validateDestinationAddress
} from '../utils'
import {
  resolveAsset,
  resolveFeeAsset,
  resolveOverriddenAsset,
  shouldPerformAssetCheck,
  validateAssetSpecifiers,
  validateAssetSupport,
  validateCurrency,
  validateDestination,
  validateTransact
} from './utils'

export const resolveTransferParams = <TApi, TRes, TSigner>(
  options: TSubstrateTransferOptions<TApi, TRes, TSigner>
) => {
  const {
    api,
    from: origin,
    currency,
    feeAsset,
    recipient: address,
    to: destination,
    version,
    sender
  } = options

  validateCurrency(currency, feeAsset)
  validateDestination(origin, destination)
  validateTransact(options)

  validateDestinationAddress(address, destination, api)
  if (sender) validateAddress(api, sender, origin, false)

  const isBridge = !isTLocation(destination) && isSubstrateBridge(origin, destination)

  const assetCheckEnabled = shouldPerformAssetCheck(origin, currency)

  validateAssetSpecifiers(assetCheckEnabled, currency)
  const asset = resolveAsset(currency, origin, destination, assetCheckEnabled)

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, origin, destination, currency)
    : undefined

  validateAssetSupport(options, assetCheckEnabled, isBridge, asset)

  const amount = Array.isArray(currency)
    ? 0n
    : abstractDecimals(currency.amount, asset?.decimals, api)

  // Ensure amount is at least 2 to avoid Rust panic (only for non-array currencies)
  const finalAmount = !Array.isArray(currency) && amount < MIN_AMOUNT ? MIN_AMOUNT : amount

  const resolvedVersion = pickCompatibleXcmVersion(origin, destination, version)

  const overriddenAsset = resolveOverriddenAsset(
    options,
    isBridge,
    assetCheckEnabled,
    resolvedFeeAsset
  )

  // In case asset check is disabled, we create asset object from currency symbol
  const resolvedAsset =
    asset ??
    ({
      symbol: 'symbol' in currency ? currency.symbol : undefined
    } as TAssetInfo)

  const finalAsset = Array.isArray(currency)
    ? // TODO: Refactor this
      // We use a dummy values when overriding with multi-assets
      // since these values won't be used but need to pass checks
      {
        ...resolvedAsset,
        amount: 0n,
        assetId: '1',
        location: {
          parents: Parents.ZERO,
          interior: {
            Here: null
          }
        }
      }
    : { ...resolvedAsset, amount: finalAmount }

  const normalizedAsset = finalAsset.location
    ? {
        ...finalAsset,
        location: normalizeLocation(finalAsset.location, resolvedVersion)
      }
    : finalAsset

  return {
    resolvedFeeAsset,
    resolvedVersion,
    overriddenAsset,
    normalizedAsset
  }
}

export const createTransfer = async <TApi, TRes, TSigner>(
  options: TSubstrateTransferOptions<TApi, TRes, TSigner>
): Promise<TRes> => {
  const {
    api,
    from: origin,
    currency,
    feeAsset,
    recipient,
    to: destination,
    paraIdTo,
    sender,
    ahAddress,
    pallet,
    method,
    transactOptions,
    isAmountAll,
    keepAlive
  } = options

  const { resolvedFeeAsset, resolvedVersion, overriddenAsset, normalizedAsset } =
    resolveTransferParams(options)

  await api.init(origin, TX_CLIENT_TIMEOUT_MS)

  return getChain<TApi, TRes, TSigner, typeof origin>(origin).transfer({
    api,
    assetInfo: normalizedAsset,
    currency,
    feeAsset: resolvedFeeAsset,
    feeCurrency: feeAsset,
    recipient,
    to: destination,
    paraIdTo,
    overriddenAsset,
    version: resolvedVersion,
    sender,
    ahAddress,
    pallet,
    method,
    transactOptions,
    isAmountAll,
    keepAlive
  })
}
