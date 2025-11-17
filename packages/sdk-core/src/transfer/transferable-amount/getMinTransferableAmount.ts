import {
  findAssetInfoOrThrow,
  findAssetOnDestOrThrow,
  findNativeAssetInfoOrThrow,
  isAssetEqual
} from '@paraspell/assets'
import { getEdFromAssetOrThrow } from '@paraspell/assets'

import { getAssetBalanceInternal } from '../../balance'
import { AmountTooLowError } from '../../errors'
import type { TGetMinTransferableAmountOptions } from '../../types'
import { abstractDecimals, padValueBy, validateAddress } from '../../utils'
import { dryRunInternal } from '../dry-run'
import { getXcmFee as getXcmFeeInternal } from '../fees'
import { FEE_PADDING } from '../type-and-then/computeFees'
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
  validateAddress(api, senderAddress, chain, false)

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, chain, destination, currency)
    : undefined

  const asset = findAssetInfoOrThrow(chain, currency, null)

  const destAsset = findAssetOnDestOrThrow(origin, destination, currency)

  const destApi = api.clone()
  await destApi.init(destination)

  const destBalance = await getAssetBalanceInternal({
    api: destApi,
    address,
    chain: destination,
    asset: destAsset
  })

  const destEd = getEdFromAssetOrThrow(destAsset)

  const nativeAssetInfo = findNativeAssetInfoOrThrow(chain)
  const isNativeAsset = isAssetEqual(nativeAssetInfo, asset)

  const paysOriginInSendingAsset =
    (!resolvedFeeAsset && isNativeAsset) ||
    (resolvedFeeAsset && isAssetEqual(resolvedFeeAsset, asset))

  const amount = abstractDecimals(currency.amount, asset.decimals, api)

  const result = await getXcmFeeInternal({
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

  let minAmount = hopFeeTotal + destinationFee + originFee + edComponent + 1n

  const createTx = async (amount: bigint) => {
    const { tx } = await builder
      .currency({
        ...currency,
        amount
      })
      ['buildInternal']()
    return tx
  }

  let tx
  try {
    tx = await createTx(minAmount)
  } catch (e) {
    if (e instanceof AmountTooLowError) {
      minAmount = padValueBy(minAmount, FEE_PADDING)
      try {
        tx = await createTx(minAmount)
      } catch {
        if (e instanceof AmountTooLowError) {
          return 0n
        }
      }
    }
  }

  const dryRunResult = await dryRunInternal({
    api,
    tx,
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
