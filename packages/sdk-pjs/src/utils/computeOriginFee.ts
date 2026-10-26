/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getNativeAssetSymbol, type TSubstrateChain } from '@paraspell/sdk-core'

import { getLocationTokenId } from './getLocationTokenId'

export const computeOriginFee = (
  dryRun: any,
  chain: TSubstrateChain,
  executionFee: bigint
): bigint => {
  // Extract delivery fees from emitted events
  const deliveryFees: Array<{ plancks: bigint; tokenSymbol: string }> = []
  let assetConversionFee = 0n

  for (const e of dryRun.Ok.emittedEvents) {
    const isXcmEvent =
      e.section === 'xcmPallet' || e.section === 'polkadotXcm' || e.section === 'cumulusXcm'
    const isFeesPaid = e.method === 'FeesPaid'
    if (isXcmEvent && isFeesPaid && e.data.fees) {
      for (const feeItem of e.data.fees) {
        if (feeItem.fun.NonFungible) continue
        const plancks = BigInt(feeItem.fun.Fungible.replace(/,/g, ''))
        const tokenSymbol = getLocationTokenId(feeItem.id, chain)
        if (!tokenSymbol || !plancks) continue
        deliveryFees.push({ plancks, tokenSymbol })
      }
    }
    // Humanized AssetConversion event: { section: 'assetConversion',
    // method: 'SwapCreditExecuted', data: { amountIn: '1,000' } }. A
    // SwapCreditExecuted event only fires when a fee-asset swap pays the
    // origin fees, so its presence is itself the fee-asset signal (this
    // function takes no isFeeAsset flag, matching the PAPI behaviour of
    // returning the swap cost for a fee-asset transfer).
    if (e.section === 'assetConversion' && e.method === 'SwapCreditExecuted') {
      const amountIn = e.data?.amountIn ?? e.data?.amount_in
      if (amountIn !== undefined && amountIn !== null) {
        assetConversionFee += BigInt(String(amountIn).replace(/,/g, ''))
      }
    }
  }

  if (assetConversionFee > 0n) {
    return assetConversionFee
  }

  const nativeAssetSymbol = getNativeAssetSymbol(chain)

  // Sum the fees that match the feeToken
  const totalDeliveryFees = deliveryFees
    .filter(df => df.tokenSymbol === nativeAssetSymbol)
    .reduce((acc, df) => acc + df.plancks, 0n)
  return totalDeliveryFees + executionFee
}
