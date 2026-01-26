// Contains basic call formatting for different XCM Palletss

import type { TAssetInfo } from '@paraspell/assets'
import { normalizeLocation } from '@paraspell/assets'
import { isSubstrateBridge, isTLocation, Parents } from '@paraspell/sdk-common'

import { MIN_AMOUNT, TX_CLIENT_TIMEOUT_MS } from '../constants'
import type { TSendOptions } from '../types'
import { abstractDecimals, getChain, validateAddress } from '../utils'
import { getChainVersion } from '../utils/chain'
import {
  resolveAsset,
  resolveFeeAsset,
  resolveOverriddenAsset,
  selectXcmVersion,
  shouldPerformAssetCheck,
  validateAssetSpecifiers,
  validateAssetSupport,
  validateCurrency,
  validateDestination,
  validateDestinationAddress
} from './utils'

export const send = async <TApi, TRes>(options: TSendOptions<TApi, TRes>): Promise<TRes> => {
  const {
    api,
    from: origin,
    currency,
    feeAsset,
    address,
    to: destination,
    paraIdTo,
    version,
    senderAddress,
    ahAddress,
    pallet,
    method,
    isAmountAll
  } = options

  validateCurrency(currency, feeAsset)
  validateDestination(origin, destination)

  validateDestinationAddress(address, destination, api)
  if (senderAddress) validateAddress(api, senderAddress, origin, false)

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

  const originVersion = getChainVersion(origin)

  const destVersion = !isTLocation(destination) ? getChainVersion(destination) : undefined

  const overriddenAsset = resolveOverriddenAsset(
    options,
    isBridge,
    assetCheckEnabled,
    resolvedFeeAsset
  )

  await api.init(origin, TX_CLIENT_TIMEOUT_MS)

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

  const finalVersion = selectXcmVersion(version, originVersion, destVersion)

  const normalizedAsset = finalAsset.location
    ? {
        ...finalAsset,
        location: normalizeLocation(finalAsset.location, finalVersion)
      }
    : finalAsset

  return getChain<TApi, TRes, typeof origin>(origin).transfer({
    api,
    assetInfo: normalizedAsset,
    currency,
    feeAsset: resolvedFeeAsset,
    feeCurrency: feeAsset,
    address,
    to: destination,
    paraIdTo,
    overriddenAsset,
    version: finalVersion,
    senderAddress,
    ahAddress,
    pallet,
    method,
    isAmountAll
  })
}
