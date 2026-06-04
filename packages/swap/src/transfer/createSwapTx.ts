import { parseUnits } from '@paraspell/sdk-core';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../types';
import { buildFromExchangeExtrinsic, convertTxToTarget, pickExchangeApiVariant } from './utils';

const FEE_ESTIMATION_UNITS = '100';

export const calculateFromExchangeFee = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
>(
  options: TTransformedOptions<
    TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>,
    TApi,
    TRes,
    TSigner,
    TCustomChain
  >,
) => {
  const { exchange, destination, feeCalcAddress, sender, api } = options;
  if (!destination || destination.chain === exchange.chain) return 0n;
  const dummyAmount = parseUnits(FEE_ESTIMATION_UNITS, exchange.assetTo.decimals);
  const tx = await buildFromExchangeExtrinsic({
    exchange,
    destination,
    amount: dummyAmount,
    sender,
    api,
  });
  const { partialFee } = await exchange.api.getPaymentInfo(tx, feeCalcAddress);
  return partialFee;
};

export const createSwapTx = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  exchange: ExchangeChain,
  options: TTransformedOptions<
    TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>,
    TApi,
    TRes,
    TSigner,
    TCustomChain
  >,
  isForFeeEstimation = false,
) => {
  const toDestTxFee = await calculateFromExchangeFee(options);

  const swapResult = await exchange.handleMultiSwap(
    {
      ...options,
      ...pickExchangeApiVariant(options.exchange),
      api: options.exchange.api,
      assetFrom: options.exchange.assetFrom,
      assetTo: options.exchange.assetTo,
      isForFeeEstimation,
    },
    toDestTxFee,
  );

  const txs = await Promise.all(
    swapResult.txs.map((tx) => convertTxToTarget(tx, options.exchange.api)),
  );

  return { txs, amountOut: swapResult.amountOut };
};
