import {
  findAssetInfoOrThrow,
  findAssetOnDestOrThrow,
  findNativeAssetInfoOrThrow,
  isAssetEqual
} from '@paraspell/assets'
import { getEdFromAssetOrThrow } from '@paraspell/assets'

import { getAssetBalanceInternal } from '../../pallets/assets'
import type { TGetMinTransferableAmountOptions } from '../../types'
import { abstractDecimals, validateAddress } from '../../utils'
import { dryRunInternal } from '../dry-run'
import { getXcmFee } from '../fees'
import { resolveFeeAsset } from '../utils'

export const getMinTransferableAmountInternal = async <TApi, TRes>({
  api,
  origin,
  senderAddress,
  address,
  origin: chain,
  destination,
  currency,
  feeAsset,
  buildTx,
  builder
}: TGetMinTransferableAmountOptions<TApi, TRes>): Promise<bigint> => {
  validateAddress(senderAddress, chain, false)

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, chain, destination, currency)
    : undefined

  const asset = findAssetInfoOrThrow(chain, currency, null)

  const destAsset = findAssetOnDestOrThrow(origin, destination, currency)

  const destCurrency = destAsset.location
    ? { location: destAsset.location }
    : { symbol: destAsset.symbol }

  const destApi = api.clone()
  await destApi.init(destination)

  const destBalance = await getAssetBalanceInternal({
    api: destApi,
    address,
    chain: destination,
    currency: destCurrency
  })

  const destEd = getEdFromAssetOrThrow(destAsset)

  const nativeAssetInfo = findNativeAssetInfoOrThrow(chain)
  const isNativeAsset = isAssetEqual(nativeAssetInfo, asset)

  const paysOriginInSendingAsset =
    (!resolvedFeeAsset && isNativeAsset) ||
    (resolvedFeeAsset && isAssetEqual(resolvedFeeAsset, asset))

  const amount = abstractDecimals(currency.amount, asset.decimals, api)

  const result = await getXcmFee({
    api,
    origin,
    destination,
    buildTx,
    senderAddress,
    address,
    currency: {
      ...currency,
      amount
    },
    feeAsset,
    disableFallback: false
  })

  const originFee =
    result.origin && paysOriginInSendingAsset && isAssetEqual(result.origin.asset, asset)
      ? result.origin.fee
      : 0n

  const hopFeeTotal = result.hops.reduce((acc, hop) => {
    // only add if asset is equal
    return isAssetEqual(hop.result.asset, asset) ? acc + hop.result.fee : acc
  }, 0n)

  const destinationFee =
    result.destination && isAssetEqual(result.destination.asset, asset)
      ? result.destination.fee
      : 0n

  const edComponent = destBalance === 0n ? destEd : 0n

  const minAmount = hopFeeTotal + destinationFee + originFee + edComponent + 1n

  const modifiedBuilder = builder.currency({
    ...currency,
    amount: minAmount
  })

  const dryRunResult = await dryRunInternal({
    api,
    tx: await modifiedBuilder['buildInternal'](),
    origin: chain,
    destination,
    senderAddress,
    address,
    currency: {
      ...currency,
      amount: minAmount
    },
    feeAsset
  })

  if (dryRunResult.failureReason) {
    return 0n
  }

  return minAmount
}

export const getMinTransferableAmount = async <TApi, TRes>(
  options: TGetMinTransferableAmountOptions<TApi, TRes>
): Promise<bigint> => {
  const { api } = options
  api.setDisconnectAllowed(false)
  try {
    return await getMinTransferableAmountInternal(options)
  } finally {
    api.setDisconnectAllowed(true)
    await api.disconnect()
  }
}
