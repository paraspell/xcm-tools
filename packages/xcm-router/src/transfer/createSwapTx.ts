import type ExchangeNode from '../dexNodes/DexNode';
import { buildFromExchangeExtrinsic, buildToExchangeExtrinsic } from './utils';
import { calculateTransactionFee } from '../utils/utils';
import type { TBuildTransactionsOptionsModified } from '../types';
import BigNumber from 'bignumber.js';

export const calculateFromExchangeFee = async (options: TBuildTransactionsOptionsModified) => {
  const { to, exchange, feeCalcAddress } = options;
  if (!to || to === exchange.baseNode) return BigNumber(0);
  const tx = await buildFromExchangeExtrinsic({
    ...options,
    to,
  });
  return calculateTransactionFee(tx, feeCalcAddress);
};

export const calculateToExchangeFee = async (options: TBuildTransactionsOptionsModified) => {
  const { origin, feeCalcAddress } = options;
  if (!origin) return BigNumber(0);
  const tx = await buildToExchangeExtrinsic({
    ...options,
    origin,
  });
  return calculateTransactionFee(tx, feeCalcAddress);
};

export const createSwapTx = async (
  exchange: ExchangeNode,
  options: TBuildTransactionsOptionsModified,
) => {
  const toExchangeTxFee = await calculateToExchangeFee(options);
  const toDestTxFee = await calculateFromExchangeFee(options);

  return exchange.swapCurrency(
    options.exchange.api,
    {
      ...options,
      assetFrom: options.exchange.assetFrom,
      assetTo: options.exchange.assetTo,
    },
    toDestTxFee,
    toExchangeTxFee,
  );
};
