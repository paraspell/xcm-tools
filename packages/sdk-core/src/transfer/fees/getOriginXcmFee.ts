/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { getNativeAssetSymbol, hasDryRunSupport } from '@paraspell/assets'

import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import type { TGetOriginXcmFeeOptions, TXcmFeeDetail } from '../../types'
import { resolveFeeAsset } from '../utils/resolveFeeAsset'
import { isSufficientOrigin } from './isSufficient'
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

  const nativeAssetSymbol = getNativeAssetSymbol(origin)

  if (!hasDryRunSupport(origin)) {
    const rawFee = await api.calculateTransactionFee(tx, senderAddress)
    const paddedFee = padFee(rawFee, origin, destination, 'origin')
    const sufficient = await isSufficientOrigin(
      api,
      origin,
      senderAddress,
      paddedFee,
      resolvedFeeAsset
    )

    return {
      fee: paddedFee,
      currency: nativeAssetSymbol,
      feeType: 'paymentInfo',
      sufficient
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
    const paddedFee = padFee(rawFee, origin, destination, 'origin')
    const sufficient = await isSufficientOrigin(
      api,
      origin,
      senderAddress,
      paddedFee,
      resolvedFeeAsset
    )

    return {
      fee: paddedFee,
      currency: nativeAssetSymbol,
      feeType: 'paymentInfo',
      dryRunError: dryRunResult.failureReason,
      sufficient
    }
  }

  const { fee, forwardedXcms, destParaId, weight } = dryRunResult

  const currencySymbol = resolvedFeeAsset ? resolvedFeeAsset.symbol : nativeAssetSymbol

  return {
    fee,
    feeType: 'dryRun',
    sufficient: true,
    currency: currencySymbol,
    forwardedXcms,
    destParaId,
    weight
  }
}
