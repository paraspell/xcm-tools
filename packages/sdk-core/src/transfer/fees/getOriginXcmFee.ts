/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { getNativeAssetSymbol, hasDryRunSupport } from '@paraspell/assets'

import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import type { TGetOriginXcmFeeOptions, TXcmFeeDetail } from '../../types'
import { padFee } from './padFee'

export const getOriginXcmFee = async <TApi, TRes>({
  api,
  tx,
  origin,
  destination,
  senderAddress,
  disableFallback
}: TGetOriginXcmFeeOptions<TApi, TRes>): Promise<
  TXcmFeeDetail & {
    forwardedXcms?: any
    destParaId?: number
  }
> => {
  await api.init(origin, DRY_RUN_CLIENT_TIMEOUT_MS)

  const currency = getNativeAssetSymbol(origin)

  if (!hasDryRunSupport(origin)) {
    const rawFee = await api.calculateTransactionFee(tx, senderAddress)
    return {
      fee: padFee(rawFee, origin, destination, 'origin'),
      currency,
      feeType: 'paymentInfo'
    }
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
      currency,
      feeType: 'paymentInfo',
      dryRunError: dryRunResult.failureReason
    }
  }

  const { fee, forwardedXcms, destParaId } = dryRunResult

  return {
    fee,
    feeType: 'dryRun',
    currency,
    forwardedXcms,
    destParaId
  }
}
