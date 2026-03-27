import type { TXcmFeeDetail } from '@paraspell/sdk-core';
import { AmountTooLowError, applyDecimalAbstraction, getOriginXcmFee } from '@paraspell/sdk-core';

import type ExchangeChain from '../../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../../types';
import { createSwapTx } from '../createSwapTx';

export const getSwapFee = async <TApi, TRes, TSigner, TDisableFallback extends boolean = false>(
  exchange: ExchangeChain,
  options: TTransformedOptions<TBuildTransactionsOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>,
  disableFallback?: TDisableFallback,
): Promise<{ result: TXcmFeeDetail; amountOut: bigint }> => {
  const {
    sender,
    exchange: { assetFrom, api },
    amount,
  } = options;
  let txs: unknown[];
  let amountOut: bigint;

  const isForFeeEstimation = true;

  try {
    const swapResult = await createSwapTx(exchange, options, isForFeeEstimation);
    txs = swapResult.txs;
    amountOut = swapResult.amountOut;
  } catch (e: unknown) {
    if (!(e instanceof AmountTooLowError)) throw e;
    txs = [null];
    amountOut = 0n;
  }

  const buildTx = async (overrideAmount?: string) => {
    const txOptions = {
      ...options,
      ...(overrideAmount
        ? { amount: applyDecimalAbstraction(overrideAmount, assetFrom.decimals, true) }
        : {}),
    };
    const { txs } = await createSwapTx(exchange, txOptions, isForFeeEstimation);
    return txs[0];
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

  const finalFee = (result.fee as bigint) * BigInt(txs.length);

  return {
    result: {
      ...result,
      fee: finalFee,
    },
    amountOut,
  };
};
