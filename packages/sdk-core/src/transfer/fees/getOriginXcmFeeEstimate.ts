import { findAssetInfoOrThrow } from '@paraspell/assets'

import type { TGetOriginXcmFeeEstimateOptions, TGetXcmFeeEstimateDetail } from '../../types'
import { abstractDecimals } from '../../utils'
import { padFee } from '../../utils/fees'
import { resolveFeeAsset } from '../utils'
import { isSufficientOrigin } from './isSufficient'

export const getOriginXcmFeeEstimate = async <TApi, TRes>({
  api,
  tx,
  origin,
  destination,
  currency,
  senderAddress,
  feeAsset
}: TGetOriginXcmFeeEstimateOptions<TApi, TRes>): Promise<TGetXcmFeeEstimateDetail> => {
  const originAsset = findAssetInfoOrThrow(origin, currency, destination)

  const amount = abstractDecimals(currency.amount, originAsset.decimals, api)

  const rawOriginFee = await api.calculateTransactionFee(tx, senderAddress)

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
