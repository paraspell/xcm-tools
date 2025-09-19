import { AmountTooLowError } from '../../errors'
import type { TGetXcmFeeOptions, TGetXcmFeeResult } from '../../types'
import { getBypassResultWithRetries } from './getBypassResult'
import { getXcmFeeInternal } from './getXcmFeeInternal'

export const getXcmFee = async <TApi, TRes, TDisableFallback extends boolean>(
  options: TGetXcmFeeOptions<TApi, TRes, TDisableFallback>
): Promise<TGetXcmFeeResult<TDisableFallback>> => {
  const { buildTx, api } = options
  try {
    const tx = await buildTx()
    const real = await getXcmFeeInternal({ ...options, tx, useRootOrigin: false })
    const forced = await getBypassResultWithRetries(options, getXcmFeeInternal, tx)

    return {
      ...forced,
      origin: { ...forced.origin, sufficient: real.origin.sufficient },
      destination: { ...forced.destination, sufficient: real.destination.sufficient },
      ...(forced.assetHub
        ? { assetHub: { ...forced.assetHub, sufficient: real.assetHub?.sufficient } }
        : {}),
      ...(forced.bridgeHub
        ? { bridgeHub: { ...forced.bridgeHub, sufficient: real.bridgeHub?.sufficient } }
        : {}),
      hops: forced.hops.map((hop, i) => ({
        ...hop,
        result: { ...hop.result, sufficient: real.hops[i]?.result?.sufficient }
      }))
    }
  } catch (e: unknown) {
    if (!(e instanceof AmountTooLowError)) throw e

    const forced = await getBypassResultWithRetries(options, getXcmFeeInternal)

    return {
      ...forced,
      origin: { ...forced.origin, sufficient: false },
      destination: { ...forced.destination, sufficient: false },
      ...(forced.assetHub ? { assetHub: { ...forced.assetHub, sufficient: false } } : {}),
      ...(forced.bridgeHub ? { bridgeHub: { ...forced.bridgeHub, sufficient: false } } : {}),
      hops: forced.hops.map(hop => ({
        ...hop,
        result: { ...hop.result, sufficient: false }
      }))
    }
  } finally {
    await api.disconnect()
  }
}
