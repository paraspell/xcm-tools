import type { TGetXcmFeeOptions, TGetXcmFeeResult } from '../../types'
import { getXcmFeeInternal } from './getXcmFeeInternal'

export const getXcmFee = async <TApi, TRes, TDisableFallback extends boolean>(
  options: TGetXcmFeeOptions<TApi, TRes, TDisableFallback>
): Promise<TGetXcmFeeResult<TDisableFallback>> => {
  const { tx, txBypass } = options.txs

  const forced = await getXcmFeeInternal({ ...options, tx: txBypass, useRootOrigin: true })
  const real = await getXcmFeeInternal({ ...options, tx, useRootOrigin: false })

  const { api } = options

  await api.disconnect()

  return {
    ...forced,
    origin: {
      ...forced.origin,
      sufficient: real.origin.sufficient
    },
    destination: {
      ...forced.destination,
      sufficient: real.destination.sufficient
    },
    ...(forced.assetHub
      ? {
          assetHub: {
            ...forced.assetHub,
            sufficient: real.assetHub?.sufficient
          }
        }
      : {}),
    ...(forced.bridgeHub
      ? {
          bridgeHub: {
            ...forced.bridgeHub,
            sufficient: real.bridgeHub?.sufficient
          }
        }
      : {}),
    hops: forced.hops.map((hop, index) => ({
      ...hop,
      result: {
        ...hop.result,
        sufficient: real.hops[index]?.result.sufficient
      }
    }))
  }
}
