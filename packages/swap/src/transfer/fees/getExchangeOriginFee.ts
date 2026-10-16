import type { TConditionalXcmFeeDetail } from '@paraspell/sdk-core';

import type ExchangeChain from '../../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../../types';
import { getFromExchangeFee } from '../utils';
import { getSwapFee } from './getSwapFee';

/**
 * Fee paid on the exchange chain when it is the origin of the transfer.
 * The swap and the outgoing transfer from the exchange to the destination are signed together,
 * so both fees are paid there.
 */
export const getExchangeOriginFee = async <
  TApi,
  TRes,
  TSigner,
  TDisableFallback extends boolean = false,
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
  disableFallback?: TDisableFallback,
): Promise<TConditionalXcmFeeDetail<TDisableFallback>> => {
  const { api, exchange, destination, sender } = options;

  const { result, amountOut } = await getSwapFee(dex, options, disableFallback);

  if (!destination || destination.chain === exchange.chain) return result;

  const { origin } = await getFromExchangeFee(
    { exchange, destination, amount: amountOut, sender, api },
    disableFallback ?? false,
  );

  return { ...result, fee: (result.fee ?? 0n) + (origin.fee ?? 0n) };
};
