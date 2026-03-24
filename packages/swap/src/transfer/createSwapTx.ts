import { parseUnits } from '@paraspell/sdk-core';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../types';
import { buildFromExchangeExtrinsic, convertTxToTarget } from './utils';

const FEE_ESTIMATION_UNITS = '100';

export const calculateFromExchangeFee = async <TApi, TRes, TSigner>(
  options: TTransformedOptions<TBuildTransactionsOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>,
) => {
  const { api, exchange, destination, feeCalcAddress, sender } = options;
  if (!destination || destination.chain === exchange.baseChain) return 0n;
  const dummyAmount = parseUnits(FEE_ESTIMATION_UNITS, exchange.assetTo.decimals);
  const tx = await buildFromExchangeExtrinsic({
    exchange,
    destination,
    amount: dummyAmount,
    sender,
    api,
  });
  const { partialFee } = await api.getPaymentInfo(tx, feeCalcAddress);
  return partialFee;
};

export const createSwapTx = async <TApi, TRes, TSigner>(
  exchange: ExchangeChain,
  options: TTransformedOptions<TBuildTransactionsOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>,
  isForFeeEstimation = false,
) => {
  const { api } = options;
  const toDestTxFee = await calculateFromExchangeFee(options);

  const swapResult = await exchange.handleMultiSwap(
    options.exchange.apiPjs,
    {
      ...options,
      papiApi: options.exchange.apiPapi,
      assetFrom: options.exchange.assetFrom,
      assetTo: options.exchange.assetTo,
      isForFeeEstimation,
    },
    toDestTxFee,
  );

  const txs = await Promise.all(swapResult.txs.map((tx) => convertTxToTarget(tx, api)));

  return { txs, amountOut: swapResult.amountOut };
};
