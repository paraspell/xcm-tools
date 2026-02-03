import { AmountTooLowError } from '../../errors'
import type { TGetOriginXcmFeeOptions, TXcmFeeDetail } from '../../types'
import { getBypassResultWithRetries } from './getBypassResult'
import { getOriginXcmFeeInternal } from './getOriginXcmFeeInternal'

export const getOriginXcmFee = async <TApi, TRes, TSigner>(
  options: TGetOriginXcmFeeOptions<TApi, TRes, TSigner>
): Promise<
  TXcmFeeDetail & {
    forwardedXcms?: unknown
    destParaId?: number
  }
> => {
  const { buildTx } = options

  try {
    const tx = await buildTx()
    const real = await getOriginXcmFeeInternal({ ...options, tx, useRootOrigin: false })
    const forced = await getBypassResultWithRetries(options, getOriginXcmFeeInternal, tx)

    return {
      ...forced,
      sufficient: real.sufficient
    }
  } catch (e: unknown) {
    if (!(e instanceof AmountTooLowError)) throw e

    const forced = await getBypassResultWithRetries(options, getOriginXcmFeeInternal)

    return {
      ...forced,
      sufficient: false
    }
  }
}
