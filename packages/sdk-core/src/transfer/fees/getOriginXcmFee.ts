import { AmountTooLowError } from '../../errors'
import type { TGetOriginXcmFeeOptions, TXcmFeeDetailWithForwardedXcm } from '../../types'
import { getBypassResultWithRetries } from './getBypassResult'
import { getOriginXcmFeeInternal } from './getOriginXcmFeeInternal'

export const getOriginXcmFee = async <
  TApi,
  TRes,
  TSigner,
  TDisableFallback extends boolean = boolean,
  TCustomChain extends string = never
>(
  options: TGetOriginXcmFeeOptions<TApi, TRes, TSigner, TDisableFallback, TCustomChain>
): Promise<TXcmFeeDetailWithForwardedXcm<TDisableFallback>> => {
  const { buildTx } = options

  try {
    const tx = await buildTx()
    const real = await getOriginXcmFeeInternal({ ...options, tx, useRootOrigin: false })
    const forced = await getBypassResultWithRetries(options, getOriginXcmFeeInternal, tx)

    return {
      ...forced,
      sufficient: real.sufficient
    } as TXcmFeeDetailWithForwardedXcm<TDisableFallback>
  } catch (e: unknown) {
    if (!(e instanceof AmountTooLowError)) throw e

    const forced = await getBypassResultWithRetries(options, getOriginXcmFeeInternal)

    return {
      ...forced,
      sufficient: false
    } as TXcmFeeDetailWithForwardedXcm<TDisableFallback>
  }
}
