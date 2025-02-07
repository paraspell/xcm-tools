import type {
  TAsset,
  TCurrencyInput,
  TMultiLocation,
  TNodeDotKsmWithRelayChains,
} from '@paraspell/sdk-pjs';
import { Builder, isForeignAsset } from '@paraspell/sdk-pjs';
import type { TAdditionalTransferOptions } from '../../types';
import { ethers } from 'ethers';
import { FALLBACK_FEE_CALC_ADDRESS } from '../../consts';

export const getCurrencySelection = (
  node: TNodeDotKsmWithRelayChains,
  asset: TAsset,
): TCurrencyInput => {
  const isBifrost = node === 'BifrostPolkadot' || node === 'BifrostKusama';
  if (isForeignAsset(asset) && !isBifrost) {
    if (asset.assetId) return { id: asset.assetId };
    if (asset.multiLocation) return { multilocation: asset.multiLocation as TMultiLocation };
  }

  return { symbol: asset.symbol };
};

export type TBuildToExchangeTxOptions = {
  origin: NonNullable<TAdditionalTransferOptions['origin']>;
  exchange: TAdditionalTransferOptions['exchange'];
  senderAddress: string;
  amount: string;
};

export const buildToExchangeExtrinsic = ({
  origin: { api, node: from, assetFrom },
  exchange: { baseNode },
  senderAddress,
  amount,
}: TBuildToExchangeTxOptions) =>
  Builder(api)
    .from(from)
    .to(baseNode)
    .currency({
      ...getCurrencySelection(from, assetFrom),
      amount,
    })
    .address(senderAddress)
    .build();

export type TBuildFromExchangeTxOptions = {
  exchange: TAdditionalTransferOptions['exchange'];
  destination: NonNullable<TAdditionalTransferOptions['destination']>;
  amount: string;
};

export const buildFromExchangeExtrinsic = ({
  exchange: { api, baseNode, assetTo },
  destination,
  amount,
}: TBuildFromExchangeTxOptions) =>
  Builder(api)
    .from(baseNode)
    .to(destination.node)
    .currency({
      ...getCurrencySelection(baseNode, assetTo),
      amount,
    })
    .address(destination.address)
    .build();

export const determineFeeCalcAddress = (
  injectorAddress: string,
  recipientAddress?: string,
): string => {
  if (!ethers.isAddress(injectorAddress)) {
    // Use wallet address for fee calculation
    return injectorAddress;
  }

  if (recipientAddress && !ethers.isAddress(recipientAddress)) {
    // Use recipient address for fee calculation
    return recipientAddress;
  }

  // If both addresses are ethereum addresses, use fallback address for fee calculation
  return FALLBACK_FEE_CALC_ADDRESS;
};
