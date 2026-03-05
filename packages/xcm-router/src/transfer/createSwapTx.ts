import { parseUnits } from '@paraspell/sdk';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../types';
import { isPjsExtrinsic } from '../utils';
import { buildFromExchangeExtrinsic, convertTxToPapi } from './utils';

const FEE_ESTIMATION_UNITS = '100';

export const calculateFromExchangeFee = async (
  options: TTransformedOptions<TBuildTransactionsOptions>,
) => {
  const { exchange, destination, feeCalcAddress, senderAddress, builderOptions } = options;
  if (!destination || destination.chain === exchange.baseChain) return 0n;
  const dummyAmount = parseUnits(FEE_ESTIMATION_UNITS, exchange.assetTo.decimals);
  const tx = await buildFromExchangeExtrinsic({
    exchange,
    destination,
    amount: dummyAmount,
    senderAddress,
    builderOptions,
  });
  return tx.getEstimatedFees(feeCalcAddress);
};

export const createSwapTx = async (
  exchange: ExchangeChain,
  options: TTransformedOptions<TBuildTransactionsOptions>,
  isForFeeEstimation = false,
) => {
  const toDestTxFee = await calculateFromExchangeFee(options);

  const swapResult = await exchange.handleMultiSwap(
    options.exchange.api,
    {
      ...options,
      papiApi: options.exchange.apiPapi,
      assetFrom: options.exchange.assetFrom,
      assetTo: options.exchange.assetTo,
      isForFeeEstimation,
    },
    toDestTxFee,
  );

  const txs = await Promise.all(
    swapResult.txs.map((tx) =>
      isPjsExtrinsic(tx) ? convertTxToPapi(tx, options.exchange.apiPapi) : Promise.resolve(tx),
    ),
  );

  return { txs, amountOut: swapResult.amountOut };
};
