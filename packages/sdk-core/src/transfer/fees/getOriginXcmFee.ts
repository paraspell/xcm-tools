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
  const { tx, txBypass } = options.txs

  const forced = await getOriginXcmFeeInternal({
    ...options,
    tx: txBypass,
    useRootOrigin: true
  })
  const real = await getOriginXcmFeeInternal({ ...options, tx, useRootOrigin: false })

  return {
    ...forced,
    sufficient: real.sufficient
  }
}
