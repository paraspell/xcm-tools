// Contains basic call formatting for different XCM Palletss

import type { TNativeAsset } from '@paraspell/assets'
import { isDotKsmBridge, isRelayChain, isTMultiLocation } from '@paraspell/sdk-common'

import { TX_CLIENT_TIMEOUT_MS } from '../constants'
import { InvalidAddressError, InvalidParameterError } from '../errors'
import type { TRelayToParaDestination, TSendOptions } from '../types'
import { getNode, validateAddress } from '../utils'
import { transferRelayToPara } from './transferRelayToPara'
import {
  resolveAsset,
  resolveFeeAsset,
  resolveOverriddenAsset,
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

  const isBridge = !isTMultiLocation(destination) && isDotKsmBridge(origin, destination)

  const assetCheckEnabled = shouldPerformAssetCheck(origin, currency)

  validateAssetSpecifiers(assetCheckEnabled, currency)
  const asset = resolveAsset(currency, origin, destination, assetCheckEnabled)

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, origin, destination, currency)
    : undefined
  validateAssetSupport(options, assetCheckEnabled, isBridge, asset)

  if (isRelayChain(origin)) {
    if (destination === 'Ethereum') {
      throw new InvalidParameterError('Transfers from relay chain to Ethereum are not supported.')
    }

    if (!asset) {
      throw new InvalidParameterError('Asset is required for relay chain to relay chain transfers.')
    }

    const isLocalTransfer = origin === destination

    if (isLocalTransfer) {
      if (isTMultiLocation(address)) {
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
          value: 'multiasset' in currency ? 0n : BigInt(currency.amount)
        }
      })
    }

    return transferRelayToPara({
      api,
      origin,
      destination: destination as TRelayToParaDestination,
      address,
      asset: {
        ...asset,
        amount: 'multiasset' in currency ? 0 : currency.amount
      },
      paraIdTo,
      version,
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
    } as TNativeAsset)

  const originNode = getNode<TApi, TRes, typeof origin>(origin)

  const finalAsset =
    'multiasset' in currency
      ? { ...resolvedAsset, amount: 0, assetId: '1' }
      : // Ensure amount is at least 1 to avoid Rust panic
        { ...resolvedAsset, amount: BigInt(currency.amount) < 1n ? 1n : currency.amount }

  return originNode.transfer({
    api,
    asset: finalAsset,
    currency,
    feeAsset: resolvedFeeAsset,
    address,
    to: destination,
    paraIdTo,
    overriddenAsset,
    version,
    senderAddress,
    ahAddress,
    pallet,
    method
  })
}
