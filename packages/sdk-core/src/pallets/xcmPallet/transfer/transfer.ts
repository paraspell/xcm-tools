// Contains basic call formatting for different XCM Palletss

import type { TNativeAsset, TRelayToParaDestination, TSendOptions } from '../../../types'
import { getNode, isRelayChain } from '../../../utils'
import { isPjsClient } from '../../../utils/isPjsClient'
import { validateDestinationAddress } from './validateDestinationAddress'
import { determineAssetCheckEnabled } from './determineAssetCheckEnabled'
import { isBridgeTransfer } from './isBridgeTransfer'
import { performKeepAliveCheck } from './performKeepAliveCheck'
import { resolveAsset } from './resolveAsset'
import {
  validateCurrency,
  validateDestination,
  validateAssetSpecifiers,
  validateAssetSupport
} from './validationUtils'
import { transferRelayToPara } from './transferRelayToPara'
import { isTMultiLocation } from '../utils'
import { resolveOverriddenAsset } from './resolveOverriddenAsset'

export const send = async <TApi, TRes>(options: TSendOptions<TApi, TRes>): Promise<TRes> => {
  const {
    api,
    origin,
    currency,
    address,
    destination,
    paraIdTo,
    destApiForKeepAlive,
    version,
    ahAddress
  } = options

  validateCurrency(currency)
  validateDestination(origin, destination)
  validateDestinationAddress(address, destination)

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
      destApiForKeepAlive,
      version
    })
  }

  const overriddenAsset = resolveOverriddenAsset(options, isBridge, assetCheckEnabled)

  await api.init(origin)

  try {
    await performKeepAliveCheck(
      options,
      asset
        ? {
            ...asset,
            amount: 'multiasset' in currency ? 0 : currency.amount
          }
        : null
    )

    // In case asset check is disabled, we create asset object from currency symbol
    const resolvedAsset =
      asset ??
      ({
        symbol: 'symbol' in currency ? currency.symbol : undefined
      } as TNativeAsset)

    const originNode = getNode<TApi, TRes, typeof origin>(origin)

    return await originNode.transfer({
      api,
      asset: { ...resolvedAsset, amount: 'multiasset' in currency ? 0 : currency.amount },
      address,
      destination,
      paraIdTo,
      overriddenAsset,
      version,
      destApiForKeepAlive,
      ahAddress
    })
  } finally {
    if (isPjsClient(api.getApi())) {
      await api.disconnect()
    }
  }
}
