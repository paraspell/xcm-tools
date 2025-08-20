import type { TGetOriginXcmFeeOptions, TXcmFeeDetail } from '../../types'
import { getOriginXcmFeeInternal } from './getOriginXcmFeeInternal'

export const getOriginXcmFee = async <TApi, TRes>(
  options: TGetOriginXcmFeeOptions<TApi, TRes>
): Promise<
  TXcmFeeDetail & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    forwardedXcms?: any
    destParaId?: number
  }
> => {
  const forced = await getOriginXcmFeeInternal({ ...options, useRootOrigin: true })
  const real = await getOriginXcmFeeInternal({ ...options, useRootOrigin: false })

  return {
    ...forced,
    sufficient: real.sufficient
  }
}
