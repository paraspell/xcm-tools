/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { hasDryRunSupport } from '@paraspell/assets'

import type { TFeeType, TGetFeeForOriginNodeOptions } from '../../types'
import { padFee } from './padFee'

export const getFeeForOriginNode = async <TApi, TRes>({
  api,
  tx,
  origin,
  destination,
  senderAddress,
  disableFallback
}: TGetFeeForOriginNodeOptions<TApi, TRes>): Promise<{
  fee?: bigint
  feeType?: TFeeType
  dryRunError?: string
  forwardedXcms?: any
  destParaId?: number
}> => {
  if (!hasDryRunSupport(origin)) {
    const rawFee = await api.calculateTransactionFee(tx, senderAddress)
    return { fee: padFee(rawFee, origin, destination, 'origin'), feeType: 'paymentInfo' }
  }

  const dryRunResult = await api.getDryRunCall({
    tx,
    node: origin,
    address: senderAddress
  })

  if (!dryRunResult.success) {
    if (disableFallback) {
      return {
        dryRunError: dryRunResult.failureReason
      }
    }

    const rawFee = await api.calculateTransactionFee(tx, senderAddress)
    return {
      fee: padFee(rawFee, origin, destination, 'origin'),
      feeType: 'paymentInfo',
      dryRunError: dryRunResult.failureReason
    }
  }

  const { fee, forwardedXcms, destParaId } = dryRunResult

  return { fee, feeType: 'dryRun', forwardedXcms, destParaId }
}
