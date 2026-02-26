import type { TXcmFeeDetail } from '@paraspell/sdk';
import { AmountTooLowError, applyDecimalAbstraction, getOriginXcmFee } from '@paraspell/sdk';

import type ExchangeChain from '../../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../../types';
import { createSwapTx } from '../createSwapTx';

export const getSwapFee = async <TDisableFallback extends boolean = false>(
  exchange: ExchangeChain,
  options: TTransformedOptions<TBuildTransactionsOptions>,
  disableFallback?: TDisableFallback,
): Promise<{ result: TXcmFeeDetail; amountOut: bigint }> => {
  const {
    senderAddress,
    exchange: { assetFrom },
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
    api: options.exchange.apiPapi,
    buildTx,
    origin: exchange.chain,
    destination: exchange.chain,
    senderAddress: senderAddress,
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
