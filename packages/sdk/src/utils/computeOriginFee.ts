/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getNativeAssetSymbol, type TSubstrateChain } from '@paraspell/sdk-core'

import { getLocationTokenId } from './getLocationTokenId'

export const computeOriginFee = (
  dryRun: any,
  chain: TSubstrateChain,
  executionFee: bigint,
  isFeeAsset = false
): bigint => {
  // Extract delivery fees from emitted events
  const deliveryFees: Array<{ plancks: bigint; tokenSymbol: string }> = []
  let assetConversionFee = 0n

  for (const e of dryRun.value.emitted_events) {
    const isXcmEvent = e.type === 'XcmPallet' || e.type === 'PolkadotXcm' || e.type === 'CumulusXcm'
    const isFeesPaid = e.value.type === 'FeesPaid'

    if (isXcmEvent && isFeesPaid && e.value.value.fees) {
      for (const feeItem of e.value.value.fees) {
        if (feeItem.fun.type === 'NonFungible') continue
        const plancks = feeItem.fun.value
        const tokenSymbol = getLocationTokenId(feeItem.id, chain)
        if (!tokenSymbol || !plancks) continue
        deliveryFees.push({ plancks, tokenSymbol })
      }
    }
    if (
      isFeeAsset &&
      e.type === 'AssetConversion' &&
      e.value?.type === 'SwapCreditExecuted' &&
      e.value?.value &&
      e.value.value.amount_in !== undefined &&
      e.value.value.amount_in !== null
    ) {
      assetConversionFee += e.value.value.amount_in
    }
  }

  if (isFeeAsset && assetConversionFee > 0n) {
    return assetConversionFee
  } else {
    const nativeAssetSymbol = getNativeAssetSymbol(chain)
    const totalDeliveryFees = deliveryFees
      .filter(df => df.tokenSymbol === nativeAssetSymbol)
      .reduce((acc, df) => acc + df.plancks, 0n)
    console.log(totalDeliveryFees, executionFee)

    return totalDeliveryFees + executionFee
  }
}
