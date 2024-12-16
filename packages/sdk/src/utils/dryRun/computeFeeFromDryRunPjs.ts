/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getNativeAssetSymbol } from '../../pallets/assets'
import type { TMultiLocation, TNodeDotKsmWithRelayChains } from '../../types'
import { getMultiLocationTokenIdPjs } from './getMultiLocationTokenIdPjs'

export const computeEstimatedFeeFromDryRunPjs = (
  dryRun: any,
  node: TNodeDotKsmWithRelayChains,
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
        const tokenSymbol = getMultiLocationTokenIdPjs(feeItem.id as TMultiLocation, node)
        console.log('Token symbol:', tokenSymbol)
        console.log('Plancks:', plancks)
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

  console.log('Execution fee:', executionFee)
  console.log('Total delivery fees:', totalDeliveryFees)

  // Add the execution fee (if it's the same token)
  let estimatedFee = totalDeliveryFees
  // In the React code, they sum up executionFee + delivery fees for the tokenSymbol == feeTokenSymbol
  estimatedFee += executionFee

  return estimatedFee
}
