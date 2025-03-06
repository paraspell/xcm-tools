// Contains basic call formatting for different XCM Palletss

import { isTMultiLocation } from '../pallets/xcmPallet/utils'
import type { TNativeAsset, TRelayToParaDestination, TSendOptions } from '../types'
import { getNode, isRelayChain, validateAddress } from '../utils'
import { transferRelayToPara } from './transferRelayToPara'
import { determineAssetCheckEnabled } from './utils/determineAssetCheckEnabled'
import { isBridgeTransfer } from './utils/isBridgeTransfer'
import { resolveAsset } from './utils/resolveAsset'
import { resolveOverriddenAsset } from './utils/resolveOverriddenAsset'
import { validateDestinationAddress } from './utils/validateDestinationAddress'
import {
  validateAssetSpecifiers,
  validateAssetSupport,
  validateCurrency,
  validateDestination
} from './utils/validationUtils'

export const send = async <TApi, TRes>(options: TSendOptions<TApi, TRes>): Promise<TRes> => {
  const {
    api,
    from: origin,
    currency,
    address,
    to: destination,
    paraIdTo,
    version,
    senderAddress,
    pallet,
    method
  } = options

  validateCurrency(currency)
  validateDestination(origin, destination)
  validateDestinationAddress(address, destination)
  if (senderAddress) validateAddress(senderAddress, origin, false)

  if (isRelayChain(origin) && !isTMultiLocation(destination) && isRelayChain(destination)) {
    throw new Error('Relay chain to relay chain transfers are not supported.')
  }

  const isBridge = isBridgeTransfer(origin, destination)

  const assetCheckEnabled = determineAssetCheckEnabled(origin, currency, isBridge)

  validateAssetSpecifiers(assetCheckEnabled, currency)
  const asset = resolveAsset(currency, origin, destination, assetCheckEnabled)
  validateAssetSupport(options, assetCheckEnabled, isBridge, asset)

  if (isRelayChain(origin)) {
    if (destination === 'Ethereum') {
      throw new Error('Transfers from relay chain to Ethereum are not supported.')
    }

    if (!asset) {
      throw new Error('Asset is required for relay chain to relay chain transfers.')
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

  const overriddenAsset = resolveOverriddenAsset(options, isBridge, assetCheckEnabled)

  await api.init(origin)

  // In case asset check is disabled, we create asset object from currency symbol
  const resolvedAsset =
    asset ??
    ({
      symbol: 'symbol' in currency ? currency.symbol : undefined
    } as TNativeAsset)

  const originNode = getNode<TApi, TRes, typeof origin>(origin)

  return originNode.transfer({
    api,
    asset: { ...resolvedAsset, amount: 'multiasset' in currency ? 0 : currency.amount },
    address,
    to: destination,
    paraIdTo,
    overriddenAsset,
    version,
    senderAddress,
    pallet,
    method
  })
}
