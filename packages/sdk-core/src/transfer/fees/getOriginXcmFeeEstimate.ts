import { getNativeAssetSymbol } from '@paraspell/assets'

import type { TGetOriginXcmFeeEstimateOptions, TGetXcmFeeEstimateDetail } from '../../types'
import { padFee } from './padFee'

export const getOriginXcmFeeEstimate = async <TApi, TRes>({
  api,
  tx,
  origin,
  destination,
  senderAddress
}: TGetOriginXcmFeeEstimateOptions<TApi, TRes>): Promise<TGetXcmFeeEstimateDetail> => {
  const rawOriginFee = await api.calculateTransactionFee(tx, senderAddress)
  const originFee = padFee(rawOriginFee, origin, destination, 'origin')
  return {
    fee: originFee,
    currency: getNativeAssetSymbol(origin)
  }
}
