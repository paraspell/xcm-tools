import { Builder, isChainEvm } from '@paraspell/sdk-core';
import { ethers } from 'ethers-v6';

import { FALLBACK_FEE_CALC_ADDRESS } from '../../consts';
import type { TBuildFromExchangeTxOptions, TBuildToExchangeTxOptions } from '../../types';

export const createToExchangeBuilder = <TApi, TRes, TSigner>({
  origin,
  exchange,
  sender,
  evmSenderAddress,
  amount,
  api,
}: TBuildToExchangeTxOptions<TApi, TRes, TSigner>) =>
  Builder(api.clone())
    .from(origin.chain)
    .to(exchange.chain)
    .currency({
      location: origin.assetFrom.location,
      amount,
    })
    .sender(isChainEvm(origin.chain) ? (evmSenderAddress as string) : sender)
    .recipient(sender);

export const buildToExchangeExtrinsic = <TApi, TRes, TSigner>(
  options: TBuildToExchangeTxOptions<TApi, TRes, TSigner>,
) => createToExchangeBuilder(options).build();

export const getToExchangeFee = <TApi, TRes, TSigner, TDisableFallback extends boolean>(
  options: TBuildToExchangeTxOptions<TApi, TRes, TSigner>,
  disableFallback: TDisableFallback,
) => createToExchangeBuilder(options).getXcmFee({ disableFallback });

export const createFromExchangeBuilder = <TApi, TRes, TSigner>({
  exchange,
  destination,
  amount,
  sender,
  api,
}: TBuildFromExchangeTxOptions<TApi, TRes, TSigner>) => {
  const apiForChain = api.clone();
  return Builder(apiForChain)
    .from(exchange.chain)
    .to(destination.chain)
    .currency({
      location: exchange.assetTo.location,
      amount,
    })
    .sender(sender)
    .recipient(destination.address);
};

export const buildFromExchangeExtrinsic = <TApi, TRes, TSigner>(
  options: TBuildFromExchangeTxOptions<TApi, TRes, TSigner>,
) => createFromExchangeBuilder(options).build();

export const getFromExchangeFee = <TApi, TRes, TSigner, TDisableFallback extends boolean>(
  options: TBuildFromExchangeTxOptions<TApi, TRes, TSigner>,
  disableFallback: TDisableFallback,
) => createFromExchangeBuilder(options).getXcmFee({ disableFallback });

export const determineFeeCalcAddress = (sender: string, recipient?: string): string => {
  if (!ethers.isAddress(sender)) {
    // Use wallet address for fee calculation
    return sender;
  }

  if (recipient && !ethers.isAddress(recipient)) {
    // Use recipient address for fee calculation
    return recipient;
  }

  // If both addresses are ethereum addresses, use fallback address for fee calculation
  return FALLBACK_FEE_CALC_ADDRESS;
};
