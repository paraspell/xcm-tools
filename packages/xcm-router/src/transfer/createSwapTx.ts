import type ExchangeNode from '../dexNodes/DexNode';
import { buildFromExchangeExtrinsic, buildToExchangeExtrinsic } from './utils';
import type { TBuildTransactionsOptionsModified, TWeight } from '../types';
import BigNumber from 'bignumber.js';
import { calculateTxFee, getTxWeight } from '../utils';
import type { TAsset } from '@paraspell/sdk-pjs';

export const calculateFromExchangeFee = async (options: TBuildTransactionsOptionsModified) => {
  const { exchange, destination, amount, feeCalcAddress } = options;
  if (!destination || destination.node === exchange.baseNode) return BigNumber(0);
  const tx = await buildFromExchangeExtrinsic({
    exchange,
    destination,
    amount,
  });
  return calculateTxFee(tx, feeCalcAddress);
};

export const calculateToExchangeWeight = async (
  options: TBuildTransactionsOptionsModified,
): Promise<TWeight> => {
  const { origin, feeCalcAddress } = options;
  if (!origin) return { refTime: BigNumber(0), proofSize: BigNumber(0) };
  const tx = await buildToExchangeExtrinsic({
    ...options,
    origin,
  });
  return getTxWeight(tx, feeCalcAddress);
};

export const createSwapTx = async (
  exchange: ExchangeNode,
  options: TBuildTransactionsOptionsModified,
) => {
  const toExchangeTxFee = await calculateToExchangeWeight(options);
  const toDestTxFee = await calculateFromExchangeFee(options);

  return exchange.swapCurrency(
    options.exchange.api,
    {
      ...options,
      assetFrom: options.exchange.assetFrom as TAsset,
      assetTo: options.exchange.assetTo as TAsset,
    },
    toDestTxFee,
    toExchangeTxFee,
  );
};
