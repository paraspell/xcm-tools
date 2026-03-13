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
  }
  const nativeAssetSymbol = getNativeAssetSymbol(chain)

  // Sum the fees that match the feeToken
  const totalDeliveryFees = deliveryFees
    .filter(df => df.tokenSymbol === nativeAssetSymbol)
    .reduce((acc, df) => acc + df.plancks, 0n)

  return totalDeliveryFees + executionFee
}
