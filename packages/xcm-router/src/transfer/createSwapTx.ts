import type { ApiPromise } from '@polkadot/api';
import type ExchangeNode from '../dexNodes/DexNode';
import type { TTransferOptionsModified } from '../types';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import { buildFromExchangeExtrinsic, buildToExchangeExtrinsic } from './utils';
import { calculateTransactionFee } from '../utils/utils';

export const createSwapTx = async (
  originApi: ApiPromise,
  swapApi: ApiPromise,
  exchangeNode: ExchangeNode,
  options: TTransferOptionsModified,
): Promise<{
  amountOut: string;
  tx: Extrinsic;
}> => {
  const { amount, feeCalcAddress } = options;
  const toDestTx = await buildFromExchangeExtrinsic(swapApi, options, amount);
  const toDestTransactionFee = await calculateTransactionFee(toDestTx, feeCalcAddress);
  const toExchangeTx = await buildToExchangeExtrinsic(originApi, options);
  const toExchangeTransactionFee = await calculateTransactionFee(toExchangeTx, feeCalcAddress);
  return await exchangeNode.swapCurrency(
    swapApi,
    options,
    toDestTransactionFee,
    toExchangeTransactionFee,
  );
};
