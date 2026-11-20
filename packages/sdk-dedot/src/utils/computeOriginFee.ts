/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  getNativeAssetSymbol,
  type TSubstrateChain,
} from "@paraspell/sdk-core";

import { getLocationTokenId } from "./getLocationTokenId";

export const computeOriginFee = (
  dryRun: any,
  chain: TSubstrateChain,
  executionFee: bigint,
): bigint => {
  // Extract delivery fees from emitted events
  const deliveryFees: Array<{ plancks: bigint; tokenSymbol: string }> = [];

  for (const e of dryRun.value.emittedEvents) {
    const isXcmEvent = ["XcmPallet", "PolkadotXcm", "CumulusXcm"].includes(
      e.pallet,
    );
    const isFeesPaid = e.palletEvent.name === "FeesPaid";

    if (isXcmEvent && isFeesPaid && e.palletEvent.data.fees) {
      for (const feeItem of e.palletEvent.data.fees) {
        if (feeItem.fun.type === "NonFungible") continue;
        const plancks = feeItem.fun.value;
        const tokenSymbol = getLocationTokenId(feeItem.id, chain);
        if (!tokenSymbol || !plancks) continue;
        deliveryFees.push({ plancks, tokenSymbol });
      }
    }
  }

  const nativeAssetSymbol = getNativeAssetSymbol(chain);
  const totalDeliveryFees = deliveryFees
    .filter((df) => df.tokenSymbol === nativeAssetSymbol)
    .reduce((acc, df) => acc + df.plancks, 0n);
  return totalDeliveryFees + executionFee;
};
