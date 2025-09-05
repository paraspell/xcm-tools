/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { findAssetInfoOrThrow, getNativeAssetSymbol, hasDryRunSupport } from '@paraspell/assets'

import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import type { TGetOriginXcmFeeOptions, TXcmFeeDetail } from '../../types'
import { abstractDecimals } from '../../utils'
import { resolveFeeAsset } from '../utils/resolveFeeAsset'
import { isSufficientOrigin } from './isSufficient'
import { padFee } from './padFee'

export const getOriginXcmFeeInternal = async <TApi, TRes>({
  api,
  tx,
  origin,
  destination,
  senderAddress,
  disableFallback,
  feeAsset,
  currency,
  useRootOrigin = false
}: TGetOriginXcmFeeOptions<TApi, TRes>): Promise<
  TXcmFeeDetail & {
    forwardedXcms?: any
    destParaId?: number
  }
> => {
  const asset = findAssetInfoOrThrow(origin, currency, destination)

  const amount = abstractDecimals(currency.amount, asset.decimals, api)

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
      destination,
      senderAddress,
      paddedFee,
      {
        ...currency,
        amount
      },
      asset,
      resolvedFeeAsset
    )

    return {
      fee: paddedFee,
      currency: nativeAssetSymbol,
      asset: resolvedFeeAsset ?? asset,
      feeType: 'paymentInfo',
      sufficient
    }
  }

  const dryRunResult = await api.getDryRunCall({
    tx,
    chain: origin,
    address: senderAddress,
    asset: {
      ...asset,
      amount
    },
    feeAsset: resolvedFeeAsset,
    // Force dryRun pass
    useRootOrigin
  })

  if (!dryRunResult.success) {
    if (disableFallback) {
      return {
        dryRunError: dryRunResult.failureReason,
        currency: dryRunResult.currency,
        asset: dryRunResult.asset
      }
    }

    const rawFee = await api.calculateTransactionFee(tx, senderAddress)
    const paddedFee = padFee(rawFee, origin, destination, 'origin')

    return {
      fee: paddedFee,
      currency: dryRunResult.currency,
      asset: dryRunResult.asset,
      feeType: 'paymentInfo',
      dryRunError: dryRunResult.failureReason,
      sufficient: false
    }
  }

  const { fee, forwardedXcms, destParaId, weight } = dryRunResult

  return {
    fee,
    feeType: 'dryRun',
    sufficient: true,
    currency: dryRunResult.currency,
    asset: dryRunResult.asset,
    forwardedXcms,
    destParaId,
    weight
  }
}
