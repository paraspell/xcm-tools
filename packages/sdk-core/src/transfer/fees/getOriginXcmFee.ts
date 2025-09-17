import type { TGetOriginXcmFeeOptions, TXcmFeeDetail } from '../../types'
import { createTxs } from '../../utils/builder'
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
  const { builder } = options

  const { tx, txBypassAmount } = await createTxs(options, builder)

  const forced = await getOriginXcmFeeInternal({
    ...options,
    tx: txBypassAmount,
    useRootOrigin: true
  })
  const real = await getOriginXcmFeeInternal({ ...options, tx, useRootOrigin: false })

  return {
    ...forced,
    sufficient: real.sufficient
  }
}
