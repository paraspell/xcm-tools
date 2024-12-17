/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getNativeAssetSymbol } from '../../pallets/assets'
import type { TNodeDotKsmWithRelayChains } from '../../types'
import { getMultiLocationTokenId } from './getMultiLocationTokenId'

export const computeFeeFromDryRun = (
  dryRun: any,
  node: TNodeDotKsmWithRelayChains,
  executionFee: bigint
): bigint => {
  // Extract delivery fees from emitted events
  const deliveryFees: Array<{ plancks: bigint; tokenSymbol: string }> = []

  for (const e of dryRun.value.emitted_events) {
    const isXcmEvent = e.type === 'XcmPallet' || e.type === 'PolkadotXcm' || e.type === 'CumulusXcm'
    const isFeesPaid = e.value.type === 'FeesPaid'

    if (isXcmEvent && isFeesPaid && e.value.value.fees) {
      for (const feeItem of e.value.value.fees) {
        if (feeItem.fun.type === 'NonFungible') continue
        const plancks = feeItem.fun.value
        const tokenSymbol = getMultiLocationTokenId(feeItem.id, node)
        if (!tokenSymbol || !plancks) continue
        deliveryFees.push({ plancks, tokenSymbol })
      }
    }
  }

  const nativeAssetSymbol = getNativeAssetSymbol(node)

  // Sum the fees that match the feeToken
  const totalDeliveryFees = deliveryFees
    .filter(df => df.tokenSymbol === nativeAssetSymbol)
    .reduce((acc, df) => acc + df.plancks, BigInt(0))

  return totalDeliveryFees + executionFee
}
