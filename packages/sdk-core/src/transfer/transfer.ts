// Contains basic call formatting for different XCM Palletss

import { normalizeLocation, type TNativeAssetInfo } from '@paraspell/assets'
import { isDotKsmBridge, isRelayChain, isTLocation } from '@paraspell/sdk-common'

import { TX_CLIENT_TIMEOUT_MS } from '../constants'
import { InvalidAddressError, InvalidParameterError } from '../errors'
import type { TRelayToParaDestination, TSendOptions } from '../types'
import { getChain, validateAddress } from '../utils'
import { getChainVersion } from '../utils/chain'
import { transferRelayToPara } from './transferRelayToPara'
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
    method
  } = options

  validateCurrency(currency, feeAsset)
  validateDestination(origin, destination)

  validateDestinationAddress(address, destination)
  if (senderAddress) validateAddress(senderAddress, origin, false)

  const isBridge = !isTLocation(destination) && isDotKsmBridge(origin, destination)

  const assetCheckEnabled = shouldPerformAssetCheck(origin, currency)

  validateAssetSpecifiers(assetCheckEnabled, currency)
  const asset = resolveAsset(currency, origin, destination, assetCheckEnabled)

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, origin, destination, currency)
    : undefined
  validateAssetSupport(options, assetCheckEnabled, isBridge, asset)

  const originVersion = getChainVersion(origin)

  const destVersion = !isTLocation(destination) ? getChainVersion(destination) : undefined

  const resolvedVersion = selectXcmVersion(version, originVersion, destVersion)

  if (isRelayChain(origin)) {
    if (destination === 'Ethereum') {
      throw new InvalidParameterError('Transfers from relay chain to Ethereum are not supported.')
    }

    if (!asset) {
      throw new InvalidParameterError('Asset is required for relay chain to relay chain transfers.')
    }

    const isLocalTransfer = origin === destination

    if (isLocalTransfer) {
      if (isTLocation(address)) {
        throw new InvalidAddressError(
          'Multi-Location address is not supported for local transfers.'
        )
      }

      await api.init(origin, TX_CLIENT_TIMEOUT_MS)
      return api.callTxMethod({
        module: 'Balances',
        method: 'transfer_keep_alive',
        parameters: {
          dest: { Id: address },
          value: Array.isArray(currency) ? 0n : BigInt(currency.amount)
        }
      })
    }

    return transferRelayToPara({
      api,
      origin,
      destination: destination as TRelayToParaDestination,
      address,
      assetInfo: {
        ...asset,
        amount: Array.isArray(currency) ? 0n : BigInt(currency.amount)
      },
      paraIdTo,
      version: resolvedVersion,
      pallet,
      method
    })
  }

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
    } as TNativeAssetInfo)

  const finalAsset = Array.isArray(currency)
    ? { ...resolvedAsset, amount: 0n, assetId: '1' }
    : // Ensure amount is at least 2 to avoid Rust panic
      { ...resolvedAsset, amount: BigInt(currency.amount) < 2n ? 2n : BigInt(currency.amount) }

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
    method
  })
}
