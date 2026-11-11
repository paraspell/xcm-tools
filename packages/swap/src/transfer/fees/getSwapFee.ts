import type { TConditionalXcmFeeDetail } from '@paraspell/sdk-core';
import { AmountTooLowError, applyDecimalAbstraction, getOriginXcmFee } from '@paraspell/sdk-core';

import type ExchangeChain from '../../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../../types';
import { createSwapTx } from '../createSwapTx';

export const getSwapFee = async <
  TApi,
  TRes,
  TSigner,
  TDisableFallback extends boolean = false,
  TCustomChain extends string = never,
>(
  exchange: ExchangeChain,
  options: TTransformedOptions<
    TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>,
    TApi,
    TRes,
    TSigner,
    TCustomChain
  >,
  disableFallback?: TDisableFallback,
): Promise<{ result: TConditionalXcmFeeDetail<TDisableFallback>; amountOut: bigint }> => {
  const {
    sender,
    exchange: { assetFrom, api },
    amount,
  } = options;
  let amountOut: bigint;

  const isForFeeEstimation = true;

  try {
    ({ amountOut } = await createSwapTx(exchange, options, isForFeeEstimation));
  } catch (e: unknown) {
    if (!(e instanceof AmountTooLowError)) throw e;
    amountOut = 0n;
  }

  const buildTx = async (overrideAmount?: string) => {
    const txOptions = {
      ...options,
      ...(overrideAmount
        ? { amount: applyDecimalAbstraction(overrideAmount, assetFrom.decimals, true) }
        : {}),
    };
    const { tx } = await createSwapTx(exchange, txOptions, isForFeeEstimation);
    return tx;
  };

  const result = await getOriginXcmFee({
    api,
    buildTx,
    origin: exchange.chain,
    destination: exchange.chain,
    sender,
    currency: {
      location: assetFrom.location,
      amount,
    },
    disableFallback: disableFallback ?? false,
  });

  return {
    result: {
      ...result,
      fee: result.fee ?? 0n,
    },
    amountOut,
  };
};
