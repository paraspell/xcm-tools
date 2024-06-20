import { type ApiPromise } from '@polkadot/api';
import { type TTransferOptionsModified, TransactionType, TransactionStatus } from '../types';
import { calculateTransactionFee, maybeUpdateTransferStatus } from '../utils/utils';
import { buildFromExchangeExtrinsic, buildToExchangeExtrinsic, submitSwap } from './utils';
import { type Extrinsic } from '@paraspell/sdk';
import type ExchangeNode from '../dexNodes/DexNode';

export const createSwapExtrinsic = async (
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

export const swap = async (
  options: TTransferOptionsModified,
  swapTx: Extrinsic,
  swapApi: ApiPromise,
): Promise<string> => {
  const { onStatusChange } = options;
  maybeUpdateTransferStatus(onStatusChange, {
    type: TransactionType.SWAP,
    status: TransactionStatus.IN_PROGRESS,
  });
  const txHash = await submitSwap(swapApi, options, swapTx);
  maybeUpdateTransferStatus(onStatusChange, {
    type: TransactionType.SWAP,
    hashes: { [TransactionType.SWAP]: txHash },
    status: TransactionStatus.SUCCESS,
  });
  return txHash;
};
