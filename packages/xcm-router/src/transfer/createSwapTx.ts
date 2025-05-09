import type { TAsset } from '@paraspell/sdk-pjs';
import BigNumber from 'bignumber.js';

import type ExchangeNode from '../dexNodes/DexNode';
import type { TBuildTransactionsOptionsModified } from '../types';
import { calculateTxFee } from '../utils';
import { buildFromExchangeExtrinsic, convertTxToPapi } from './utils';

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

export const createSwapTx = async (
  exchange: ExchangeNode,
  options: TBuildTransactionsOptionsModified,
) => {
  const toDestTxFee = await calculateFromExchangeFee(options);

  const swapResult = await exchange.swapCurrency(
    options.exchange.api,
    {
      ...options,
      assetFrom: options.exchange.assetFrom as TAsset,
      assetTo: options.exchange.assetTo as TAsset,
    },
    toDestTxFee,
  );

  return { ...swapResult, tx: await convertTxToPapi(swapResult.tx, options.exchange.apiPapi) };
};
