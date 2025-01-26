import { createApiInstanceForNode, getNodeProviders } from '@paraspell/sdk-pjs';
import {
  TransactionType,
  type TBuildTransferExtrinsicsOptions,
  type TBuildTransferExtrinsicsResult,
} from '../types';
import { validateRelayChainCurrency, calculateTransactionFee } from '../utils/utils';
import {
  buildFromExchangeExtrinsic,
  buildToExchangeExtrinsic,
  prepareTransformedOptions,
} from './utils';
import { validateTransferOptions } from './utils/validateTransferOptions';

export const buildTransferExtrinsics = async (
  options: TBuildTransferExtrinsicsOptions,
): Promise<TBuildTransferExtrinsicsResult> => {
  const { type } = options;

  validateTransferOptions(options);

  const { options: transformedOptions, dex } = await prepareTransformedOptions(options);

  const { from, to, currencyFrom, currencyTo, amount, feeCalcAddress } = transformedOptions;

  const originApi = await createApiInstanceForNode(from);
  validateRelayChainCurrency(from, currencyFrom);
  validateRelayChainCurrency(to, currencyTo);

  const transactions: TBuildTransferExtrinsicsResult = [];

  if (type === TransactionType.TO_EXCHANGE) {
    if (from !== dex.node) {
      const toExchangeTx = await buildToExchangeExtrinsic(originApi, transformedOptions);
      transactions.push({
        node: from,
        tx: toExchangeTx,
        type: 'EXTRINSIC',
        statusType: TransactionType.TO_EXCHANGE,
      });
    }
  } else if (type === TransactionType.SWAP) {
    const swapApi = await dex.createApiInstance();
    const toExchangeTx = await buildToExchangeExtrinsic(originApi, transformedOptions);
    const toExchangeTransactionFee = await calculateTransactionFee(toExchangeTx, feeCalcAddress);
    const toDestTxForSwap = await buildFromExchangeExtrinsic(swapApi, transformedOptions, amount);
    const toDestTransactionFee = await calculateTransactionFee(toDestTxForSwap, feeCalcAddress);
    const { tx: swapTx } = await dex.swapCurrency(
      swapApi,
      {
        ...transformedOptions,
        feeCalcAddress,
      },
      toDestTransactionFee,
      toExchangeTransactionFee,
    );
    transactions.push({
      node: dex.node,
      tx: swapTx,
      type: 'EXTRINSIC',
      statusType: TransactionType.SWAP,
    });
  } else if (type === TransactionType.TO_DESTINATION) {
    const swapApi = await dex.createApiInstance();
    if (to !== dex.node) {
      const toDestTx = await buildFromExchangeExtrinsic(
        swapApi,
        {
          ...transformedOptions,
          exchangeNode: dex.node,
        },
        amount,
      );
      transactions.push({
        node: dex.node,
        tx: toDestTx,
        type: 'EXTRINSIC',
        statusType: TransactionType.TO_DESTINATION,
      });
    }
  } else {
    // TO_EXCHANGE
    const toExchangeTx = await buildToExchangeExtrinsic(originApi, transformedOptions);
    if (from !== dex.node) {
      transactions.push({
        node: from,
        tx: toExchangeTx,
        type: 'EXTRINSIC',
        statusType: TransactionType.TO_EXCHANGE,
      });
    }

    // SWAP
    const swapApi = await dex.createApiInstance();
    const toExchangeTransactionFee = await calculateTransactionFee(toExchangeTx, feeCalcAddress);
    const toDestTxForSwap = await buildFromExchangeExtrinsic(swapApi, transformedOptions, amount);
    const toDestTransactionFee = await calculateTransactionFee(toDestTxForSwap, feeCalcAddress);

    const { amountOut, tx: swapTx } = await dex.swapCurrency(
      swapApi,
      {
        ...transformedOptions,
        feeCalcAddress,
      },
      toDestTransactionFee,
      toExchangeTransactionFee,
    );
    transactions.push({
      node: dex.node,
      tx: swapTx,
      type: 'EXTRINSIC',
      statusType: TransactionType.SWAP,
    });

    // TO_DESTINATION
    const toDestTx = await buildFromExchangeExtrinsic(
      swapApi,
      {
        ...transformedOptions,
        exchangeNode: dex.node,
      },
      amountOut,
    );
    if (to !== dex.node) {
      transactions.push({
        node: dex.node,
        tx: toDestTx,
        type: 'EXTRINSIC',
        statusType: TransactionType.TO_DESTINATION,
      });
    }

    await originApi.disconnect();
    await swapApi.disconnect();
  }

  const txsWithWsProviders = transactions.map((tx) => ({
    ...tx,
    wsProvider: getNodeProviders(tx.node)[0],
  }));

  return txsWithWsProviders;
};
