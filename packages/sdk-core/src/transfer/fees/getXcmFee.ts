import { AmountTooLowError } from '../../errors'
import type { TGetXcmFeeOptions, TGetXcmFeeResult } from '../../types'
import { getBypassResultWithRetries } from './getBypassResult'
import { getXcmFeeOnce } from './getXcmFeeOnce'

export const getXcmFeeInternal = async <TApi, TRes, TDisableFallback extends boolean>(
  options: TGetXcmFeeOptions<TApi, TRes, TDisableFallback>
): Promise<TGetXcmFeeResult<TDisableFallback>> => {
  const { buildTx } = options

  try {
    const tx = await buildTx()
    const real = await getXcmFeeOnce({ ...options, tx, useRootOrigin: false })
    const forced = await getBypassResultWithRetries(options, getXcmFeeOnce, tx)

    return {
      ...forced,
      origin: { ...forced.origin, sufficient: real.origin.sufficient },
      destination: { ...forced.destination, sufficient: real.destination.sufficient },
      hops: forced.hops.map((hop, i) => ({
        ...hop,
        result: { ...hop.result, sufficient: real.hops[i]?.result?.sufficient }
      }))
    }
  } catch (e: unknown) {
    if (!(e instanceof AmountTooLowError)) throw e

    const forced = await getBypassResultWithRetries(options, getXcmFeeOnce)

    return {
      ...forced,
      origin: { ...forced.origin, sufficient: false },
      destination: { ...forced.destination, sufficient: false },
      hops: forced.hops.map(hop => ({
        ...hop,
        result: { ...hop.result, sufficient: false }
      }))
    }
  }
}

export const getXcmFee = async <TApi, TRes, TDisableFallback extends boolean>(
  options: TGetXcmFeeOptions<TApi, TRes, TDisableFallback>
): Promise<TGetXcmFeeResult<TDisableFallback>> => {
  const { api } = options
  try {
    return await getXcmFeeInternal(options)
  } finally {
    await api.disconnect()
  }
}
