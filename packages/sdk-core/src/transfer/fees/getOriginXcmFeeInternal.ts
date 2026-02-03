/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  findAssetInfoOrThrow,
  findNativeAssetInfoOrThrow,
  hasDryRunSupport
} from '@paraspell/assets'

import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import type { TGetOriginXcmFeeInternalOptions, TXcmFeeDetail } from '../../types'
import { abstractDecimals, pickCompatibleXcmVersion } from '../../utils'
import { padFee } from '../../utils/fees'
import { resolveFeeAsset } from '../utils/resolveFeeAsset'
import { isSufficientOrigin } from './isSufficient'

export const getOriginXcmFeeInternal = async <TApi, TRes, TSigner>({
  api,
  tx,
  origin,
  destination,
  senderAddress,
  disableFallback,
  feeAsset,
  currency,
  version,
  useRootOrigin = false
}: TGetOriginXcmFeeInternalOptions<TApi, TRes, TSigner>): Promise<
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

  if (!hasDryRunSupport(origin)) {
    const { partialFee: rawFee } = await api.getPaymentInfo(tx, senderAddress)
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
      asset: resolvedFeeAsset ?? findNativeAssetInfoOrThrow(origin),
      feeType: 'paymentInfo',
      sufficient
    }
  }

  const resolvedVersion = pickCompatibleXcmVersion(origin, destination, version)

  const dryRunResult = await api.getDryRunCall({
    tx,
    chain: origin,
    destination,
    address: senderAddress,
    asset: {
      ...asset,
      amount
    },
    version: resolvedVersion,
    feeAsset: resolvedFeeAsset,
    // Force dryRun pass
    useRootOrigin
  })

  if (!dryRunResult.success) {
    if (disableFallback) {
      return {
        dryRunError: dryRunResult.failureReason,
        dryRunSubError: dryRunResult.failureSubReason,
        asset: dryRunResult.asset
      }
    }

    const { partialFee: rawFee } = await api.getPaymentInfo(tx, senderAddress)
    const paddedFee = padFee(rawFee, origin, destination, 'origin')

    return {
      fee: paddedFee,
      asset: dryRunResult.asset,
      feeType: 'paymentInfo',
      dryRunError: dryRunResult.failureReason,
      dryRunSubError: dryRunResult.failureSubReason,
      sufficient: false
    }
  }

  const { fee, forwardedXcms, destParaId, weight } = dryRunResult

  return {
    fee,
    feeType: 'dryRun',
    sufficient: true,
    asset: dryRunResult.asset,
    forwardedXcms,
    destParaId,
    weight
  }
}
