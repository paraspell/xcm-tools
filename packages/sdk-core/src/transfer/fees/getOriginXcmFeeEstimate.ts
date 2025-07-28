import { findAssetInfoOrThrow, getNativeAssetSymbol } from '@paraspell/assets'

import type { TGetOriginXcmFeeEstimateOptions, TGetXcmFeeEstimateDetail } from '../../types'
import { resolveFeeAsset } from '../utils'
import { isSufficientOrigin } from './isSufficient'
import { padFee } from './padFee'

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
    currency,
    originAsset,
    resolvedFeeAsset
  )

  return {
    fee: originFee,
    currency: getNativeAssetSymbol(origin),
    sufficient
  }
}
