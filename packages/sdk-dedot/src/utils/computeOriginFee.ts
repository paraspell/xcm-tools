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
  isFeeAsset = false,
): bigint => {
  // Extract delivery fees from emitted events
  const deliveryFees: Array<{ plancks: bigint; tokenSymbol: string }> = [];
  let assetConversionFee = 0n;

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
    // Dedot-shaped swap event: { pallet, palletEvent: { name, data } }.
    // Dedot decodes the struct field as either snake_case (amount_in) or
    // camelCase (amountIn); accept both. A SwapCreditExecuted event only
    // fires when a fee-asset swap pays the origin fees, so its presence is
    // itself the fee-asset signal (production never passes isFeeAsset).
    const dedotSwapAmount =
      e.pallet === "AssetConversion" &&
      e.palletEvent?.name === "SwapCreditExecuted"
        ? (e.palletEvent.data?.amount_in ?? e.palletEvent.data?.amountIn)
        : undefined;

    if (dedotSwapAmount !== undefined && dedotSwapAmount !== null) {
      assetConversionFee += dedotSwapAmount;
    } else if (
      isFeeAsset &&
      e.type === "AssetConversion" &&
      e.value?.type === "SwapCreditExecuted" &&
      e.value?.value &&
      e.value.value.amount_in !== undefined &&
      e.value.value.amount_in !== null
    ) {
      assetConversionFee += e.value.value.amount_in;
    }
  }

  if (assetConversionFee > 0n) {
    return assetConversionFee;
  } else {
    const nativeAssetSymbol = getNativeAssetSymbol(chain);
    const totalDeliveryFees = deliveryFees
      .filter((df) => df.tokenSymbol === nativeAssetSymbol)
      .reduce((acc, df) => acc + df.plancks, 0n);
    return totalDeliveryFees + executionFee;
  }
};
