import type { TXcmFeeDetailWithForwardedXcm } from '@paraspell/sdk-core';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../types';
import { getSwapFee } from './fees';
import {
  canUseExecuteTransfer,
  getFromExchangeOriginFee,
  getSwapExecuteOriginXcmFee,
  getToExchangeOriginFee,
  isFilteredError,
  validateRoutedFeeAsset,
} from './utils';

export const getSwapOriginFee = async <
  TApi,
  TRes,
  TSigner,
  TDisableFallback extends boolean,
  TCustomChain extends string = never,
>(
  dex: ExchangeChain,
  options: TTransformedOptions<
    TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>,
    TApi,
    TRes,
    TSigner,
    TCustomChain
  >,
  disableFallback: TDisableFallback,
): Promise<TXcmFeeDetailWithForwardedXcm<TDisableFallback>> => {
  const { api, origin, exchange, destination, sender } = options;

  if (canUseExecuteTransfer(dex, options)) {
    try {
      return await getSwapExecuteOriginXcmFee(dex, options, disableFallback);
    } catch (error) {
      if (!isFilteredError(error)) throw error;
      // Fall through to routed path
    }
  }

  validateRoutedFeeAsset(options);

  // Origin chain is upstream from the exchange — fee is the cost of origin -> exchange
  if (origin && origin.chain !== exchange.chain) {
    return getToExchangeOriginFee({ ...options, origin }, disableFallback);
  }

  // Origin chain is the exchange itself: fee is the swap fee (+ outgoing transfer to destination)
  const { result, amountOut } = await getSwapFee(dex, options, disableFallback);

  if (!destination || destination.chain === exchange.chain) {
    return result as TXcmFeeDetailWithForwardedXcm<TDisableFallback>;
  }

  const fromExchangeFee = await getFromExchangeOriginFee(
    { exchange, destination, amount: amountOut, sender, api },
    disableFallback,
  );

  return {
    ...result,
    fee: (result.fee ?? 0n) + (fromExchangeFee.fee ?? 0n),
    dryRunError: result.dryRunError ?? fromExchangeFee.dryRunError,
  } as TXcmFeeDetailWithForwardedXcm<TDisableFallback>;
};
