import { type ApiPromise } from '@polkadot/api';
import type ExchangeNode from '../dexNodes/DexNode';
import { type TTransferOptionsModified, TransactionType, TransactionStatus } from '../types';
import { maybeUpdateTransferStatus, calculateTransactionFee } from '../utils/utils';
import { buildFromExchangeExtrinsic, buildToExchangeExtrinsic, submitSwap } from './utils';

export const swap = async (
  options: TTransferOptionsModified,
  exchangeNode: ExchangeNode,
  originApi: ApiPromise,
  swapApi: ApiPromise,
): Promise<{ amountOut: string; txHash: string }> => {
  const { amount, feeCalcAddress, onStatusChange } = options;
  maybeUpdateTransferStatus(onStatusChange, {
    type: TransactionType.SWAP,
    status: TransactionStatus.IN_PROGRESS,
  });
  const toDestTx = await buildFromExchangeExtrinsic(swapApi, options, amount);
  const toDestTransactionFee = await calculateTransactionFee(toDestTx, feeCalcAddress);
  const toExchangeTx = await buildToExchangeExtrinsic(originApi, options);
  const toExchangeTransactionFee = await calculateTransactionFee(toExchangeTx, feeCalcAddress);
  const swapResult = await submitSwap(
    swapApi,
    exchangeNode,
    options,
    toDestTransactionFee,
    toExchangeTransactionFee,
  );
  maybeUpdateTransferStatus(onStatusChange, {
    type: TransactionType.SWAP,
    hashes: { [TransactionType.SWAP]: swapResult.txHash },
    status: TransactionStatus.SUCCESS,
  });
  return swapResult;
};
