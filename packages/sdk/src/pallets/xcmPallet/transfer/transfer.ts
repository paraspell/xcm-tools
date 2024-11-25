// Contains basic call formatting for different XCM Palletss

import type { TNativeAsset, TSendOptions } from '../../../types'
import { getNode } from '../../../utils'
import { isPjsClient } from '../../../utils/isPjsClient'
import { isOverrideMultiLocationSpecifier } from '../../../utils/multiLocation/isOverrideMultiLocationSpecifier'
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

export const send = async <TApi, TRes>(options: TSendOptions<TApi, TRes>): Promise<TRes> => {
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

  validateCurrency(currency, amount, feeAsset)
  validateDestination(origin, destination)
  validateDestinationAddress(address, destination)

  const originNode = getNode<TApi, TRes, typeof origin>(origin)

  const isBridge = isBridgeTransfer(origin, destination)

  const assetCheckEnabled = determineAssetCheckEnabled(origin, currency, isBridge)

  validateAssetSpecifiers(assetCheckEnabled, currency)
  const asset = resolveAsset(currency, origin, destination, assetCheckEnabled)
  validateAssetSupport(options, assetCheckEnabled, isBridge, asset)

  await api.init(origin)

  try {
    await performKeepAliveCheck(options, asset)

    // In case asset check is disabled, we create asset object from currency symbol
    const resolvedAsset =
      asset ??
      ({
        symbol: 'symbol' in currency ? currency.symbol : undefined
      } as TNativeAsset)

    return await originNode.transfer({
      api,
      asset: resolvedAsset,
      amount: amount?.toString() ?? '',
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
      ahAddress
    })
  } finally {
    if (isPjsClient(api)) {
      await api.disconnect()
    }
  }
}
