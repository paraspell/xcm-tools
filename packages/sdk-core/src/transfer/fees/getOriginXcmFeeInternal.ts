/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import type { TGetOriginXcmFeeInternalOptions, TXcmFeeDetail } from '../../types'
import { pickCompatibleXcmVersion } from '../../utils'
import { padFee } from '../../utils/fees'
import { resolveCurrency } from '../utils/resolveCurrency'
import { resolveFeeAsset } from '../utils/resolveFeeAsset'
import { isSufficientOrigin } from './isSufficient'

export const getOriginXcmFeeInternal = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>({
  api,
  tx,
  origin,
  destination,
  sender,
  disableFallback,
  feeAsset,
  currency,
  version,
  useRootOrigin = false
}: TGetOriginXcmFeeInternalOptions<TApi, TRes, TSigner, TCustomChain>): Promise<
  TXcmFeeDetail & {
    forwardedXcms?: any
    destParaId?: number
  }
> => {
  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(api, feeAsset, origin, destination, currency)
    : undefined

  const { assets, asset } = resolveCurrency(api, currency, resolvedFeeAsset, origin, destination)

  await api.init(origin, DRY_RUN_CLIENT_TIMEOUT_MS)

  if (!api.hasDryRunSupport(origin)) {
    const { partialFee: rawFee } = await api.getPaymentInfo(tx, sender)
    const paddedFee = padFee(rawFee, origin, destination, 'origin')
    const sufficient = await isSufficientOrigin(
      api,
      origin,
      destination,
      sender,
      paddedFee,
      asset,
      resolvedFeeAsset
    )

    return {
      fee: paddedFee,
      asset: resolvedFeeAsset ?? api.findNativeAssetInfoOrThrow(origin),
      feeType: 'paymentInfo',
      sufficient
    }
  }

  const resolvedVersion = pickCompatibleXcmVersion(api, origin, destination, version)

  const dryRunResult = await api.getDryRunCall({
    tx,
    chain: origin,
    destination,
    address: sender,
    asset,
    assets,
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

    const { partialFee: rawFee } = await api.getPaymentInfo(tx, sender)
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
