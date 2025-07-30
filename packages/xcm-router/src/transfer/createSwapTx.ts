import BigNumber from 'bignumber.js';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptionsModified } from '../types';
import { calculateTxFee, isPjsExtrinsic } from '../utils';
import { buildFromExchangeExtrinsic, convertTxToPapi } from './utils';

export const calculateFromExchangeFee = async (options: TBuildTransactionsOptionsModified) => {
  const { exchange, destination, amount, feeCalcAddress, senderAddress } = options;
  if (!destination || destination.chain === exchange.baseChain) return BigNumber(0);
  const tx = await buildFromExchangeExtrinsic({
    exchange,
    destination,
    amount,
    senderAddress,
  });
  return calculateTxFee(tx, feeCalcAddress);
};

export const createSwapTx = async (
  exchange: ExchangeChain,
  options: TBuildTransactionsOptionsModified,
) => {
  const toDestTxFee = await calculateFromExchangeFee(options);

  const swapResult = await exchange.handleMultiSwap(
    options.exchange.api,
    {
      ...options,
      papiApi: options.exchange.apiPapi,
      assetFrom: options.exchange.assetFrom,
      assetTo: options.exchange.assetTo,
    },
    toDestTxFee,
  );

  const txs = await Promise.all(
    swapResult.txs.map((tx) => {
      if (!isPjsExtrinsic(tx)) {
        return tx;
      }
      return convertTxToPapi(tx, options.exchange.apiPapi);
    }),
  );

  return { txs, amountOut: swapResult.amountOut };
};
