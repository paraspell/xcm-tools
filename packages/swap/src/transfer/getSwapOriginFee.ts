import type { TXcmFeeDetailWithForwardedXcm } from '@paraspell/sdk-core';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../types';
import { getSwapFee } from './fees';
import {
  canUseExecuteTransfer,
  getSwapExecuteOriginXcmFee,
  getToExchangeOriginFee,
  isFilteredError,
} from './utils';

export const getSwapOriginFee = async <TApi, TRes, TSigner, TDisableFallback extends boolean>(
  dex: ExchangeChain,
  options: TTransformedOptions<TBuildTransactionsOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>,
  disableFallback: TDisableFallback,
): Promise<TXcmFeeDetailWithForwardedXcm<TDisableFallback>> => {
  const { origin, exchange } = options;

  if (canUseExecuteTransfer(dex, options)) {
    try {
      return await getSwapExecuteOriginXcmFee(dex, options, disableFallback);
    } catch (error) {
      if (!isFilteredError(error)) throw error;
      // Fall through to routed path
    }
  }

  // Origin chain is upstream from the exchange — fee is the cost of origin -> exchange
  if (origin && origin.chain !== exchange.chain) {
    return getToExchangeOriginFee({ ...options, origin }, disableFallback);
  }

  // Origin chain is the exchange itself — fee is the swap fee
  const { result } = await getSwapFee(dex, options, disableFallback);
  return result as TXcmFeeDetailWithForwardedXcm<TDisableFallback>;
};
