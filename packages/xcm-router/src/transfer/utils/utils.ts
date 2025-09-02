import { Builder, isChainEvm, isForeignAsset } from '@paraspell/sdk';
import type { TAssetInfo, TCurrencyInput, TSubstrateChain } from '@paraspell/sdk-pjs';
import { ethers } from 'ethers-v6';

import { FALLBACK_FEE_CALC_ADDRESS } from '../../consts';
import type { TBuildFromExchangeTxOptions, TBuildToExchangeTxOptions } from '../../types';

export const getCurrencySelection = (chain: TSubstrateChain, asset: TAssetInfo): TCurrencyInput => {
  const isBifrost = chain === 'BifrostPolkadot' || chain === 'BifrostKusama';
  if (isForeignAsset(asset) && !isBifrost) {
    if (asset.assetId) return { id: asset.assetId };
  }

  if (asset.location) return { location: asset.location };

  return { symbol: asset.symbol };
};

const createToExchangeBuilder = ({
  origin: { api, chain: from, assetFrom },
  exchange: { baseChain },
  senderAddress,
  evmSenderAddress,
  amount,
}: TBuildToExchangeTxOptions) =>
  Builder(api)
    .from(from)
    .to(baseChain)
    .currency({
      ...getCurrencySelection(from, assetFrom),
      amount,
    })
    .address(senderAddress)
    .senderAddress(isChainEvm(from) ? (evmSenderAddress as string) : senderAddress);

export const buildToExchangeExtrinsic = (options: TBuildToExchangeTxOptions) =>
  createToExchangeBuilder(options).build();

export const getToExchangeFee = (options: TBuildToExchangeTxOptions) =>
  createToExchangeBuilder(options).getXcmFee();

export const createFromExchangeBuilder = ({
  exchange: { apiPapi, baseChain, assetTo },
  destination: { chain, address },
  amount,
  senderAddress,
}: TBuildFromExchangeTxOptions) =>
  Builder(apiPapi)
    .from(baseChain)
    .to(chain)
    .currency({
      ...getCurrencySelection(baseChain, assetTo as TAssetInfo),
      amount,
    })
    .address(address)
    .senderAddress(senderAddress);

export const buildFromExchangeExtrinsic = (options: TBuildFromExchangeTxOptions) =>
  createFromExchangeBuilder(options).build();

export const getFromExchangeFee = (options: TBuildFromExchangeTxOptions) =>
  createFromExchangeBuilder(options).getXcmFee();

export const determineFeeCalcAddress = (
  senderAddress: string,
  recipientAddress?: string,
): string => {
  if (!ethers.isAddress(senderAddress)) {
    // Use wallet address for fee calculation
    return senderAddress;
  }

  if (recipientAddress && !ethers.isAddress(recipientAddress)) {
    // Use recipient address for fee calculation
    return recipientAddress;
  }

  // If both addresses are ethereum addresses, use fallback address for fee calculation
  return FALLBACK_FEE_CALC_ADDRESS;
};
