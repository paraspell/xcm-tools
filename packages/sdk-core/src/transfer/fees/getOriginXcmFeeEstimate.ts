import { findAssetInfoOrThrow } from '@paraspell/assets'

import type { TGetOriginXcmFeeEstimateOptions, TGetXcmFeeEstimateDetail } from '../../types'
import { abstractDecimals } from '../../utils'
import { padFee } from '../../utils/fees'
import { resolveFeeAsset } from '../utils'
import { isSufficientOrigin } from './isSufficient'

/**
 * @deprecated This function is deprecated and will be removed in a future version.
 * Please use `builder.getOriginXcmFee()` instead, where `builder` is an instance of `Builder()`.
 * Will be removed in v13.
 * For more details, see the documentation:
 * {@link https://paraspell.github.io/docs/sdk/xcmPallet.html#xcm-fee-origin-and-dest}
 */
export const getOriginXcmFeeEstimate = async <TApi, TRes, TSigner>({
  api,
  tx,
  origin,
  destination,
  currency,
  senderAddress,
  feeAsset
}: TGetOriginXcmFeeEstimateOptions<TApi, TRes, TSigner>): Promise<TGetXcmFeeEstimateDetail> => {
  const originAsset = findAssetInfoOrThrow(origin, currency, destination)

  const amount = abstractDecimals(currency.amount, originAsset.decimals, api)

  const { partialFee: rawOriginFee } = await api.getPaymentInfo(tx, senderAddress)

  const originFee = padFee(rawOriginFee, origin, destination, 'origin')

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, origin, destination, currency)
    : undefined

  const sufficient = await isSufficientOrigin(
    api,
    origin,
    destination,
    senderAddress,
    originFee,
    {
      ...currency,
      amount
    },
    originAsset,
    resolvedFeeAsset
  )

  const asset = resolvedFeeAsset ?? originAsset

  return {
    fee: originFee,
    asset,
    sufficient
  }
}
