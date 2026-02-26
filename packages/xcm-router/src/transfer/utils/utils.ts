import { Builder, isChainEvm } from '@paraspell/sdk';
import { ethers } from 'ethers-v6';

import { FALLBACK_FEE_CALC_ADDRESS } from '../../consts';
import type { TBuildFromExchangeTxOptions, TBuildToExchangeTxOptions } from '../../types';

export const createToExchangeBuilder = ({
  origin: { chain: from, assetFrom },
  exchange: { baseChain },
  senderAddress,
  evmSenderAddress,
  amount,
  builderOptions,
}: TBuildToExchangeTxOptions) =>
  Builder(builderOptions)
    .from(from)
    .to(baseChain)
    .currency({
      location: assetFrom.location,
      amount,
    })
    .address(senderAddress)
    .senderAddress(isChainEvm(from) ? (evmSenderAddress as string) : senderAddress);

export const buildToExchangeExtrinsic = (options: TBuildToExchangeTxOptions) =>
  createToExchangeBuilder(options).build();

export const getToExchangeFee = <TDisableFallback extends boolean>(
  options: TBuildToExchangeTxOptions,
  disableFallback: TDisableFallback,
) => createToExchangeBuilder(options).getXcmFee({ disableFallback });

export const createFromExchangeBuilder = ({
  exchange: { apiPapi, baseChain, assetTo },
  destination: { chain, address },
  amount,
  senderAddress,
  builderOptions,
}: TBuildFromExchangeTxOptions) =>
  Builder({
    ...builderOptions,
    apiOverrides: {
      ...builderOptions?.apiOverrides,
      [baseChain]: apiPapi,
    },
  })
    .from(baseChain)
    .to(chain)
    .currency({
      location: assetTo.location,
      amount,
    })
    .address(address)
    .senderAddress(senderAddress);

export const buildFromExchangeExtrinsic = (options: TBuildFromExchangeTxOptions) =>
  createFromExchangeBuilder(options).build();

export const getFromExchangeFee = <TDisableFallback extends boolean>(
  options: TBuildFromExchangeTxOptions,
  disableFallback: TDisableFallback,
) => createFromExchangeBuilder(options).getXcmFee({ disableFallback });

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
