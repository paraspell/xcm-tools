/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { getNativeAssetSymbol, hasDryRunSupport } from '@paraspell/assets'

import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import type { TGetOriginXcmFeeOptions, TXcmFeeDetail } from '../../types'
import { resolveFeeAsset } from '../utils/resolveFeeAsset'
import { padFee } from './padFee'

export const getOriginXcmFee = async <TApi, TRes>({
  api,
  tx,
  origin,
  destination,
  senderAddress,
  disableFallback,
  feeAsset,
  currency
}: TGetOriginXcmFeeOptions<TApi, TRes>): Promise<
  TXcmFeeDetail & {
    forwardedXcms?: any
    destParaId?: number
  }
> => {
  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, origin, destination, currency)
    : undefined

  await api.init(origin, DRY_RUN_CLIENT_TIMEOUT_MS)

  const currencySymbol = resolvedFeeAsset ? resolvedFeeAsset.symbol : getNativeAssetSymbol(origin)

  if (!hasDryRunSupport(origin)) {
    const rawFee = await api.calculateTransactionFee(tx, senderAddress)
    return {
      fee: padFee(rawFee, origin, destination, 'origin'),
      currency: currencySymbol,
      feeType: 'paymentInfo'
    }
  }

  const dryRunResult = await api.getDryRunCall({
    tx,
    node: origin,
    address: senderAddress,
    isFeeAsset: !!resolvedFeeAsset
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
      currency: currencySymbol,
      feeType: 'paymentInfo',
      dryRunError: dryRunResult.failureReason
    }
  }

  const { fee, forwardedXcms, destParaId, weight } = dryRunResult

  return {
    fee,
    feeType: 'dryRun',
    currency: currencySymbol,
    forwardedXcms,
    destParaId,
    weight
  }
}
