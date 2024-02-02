import { createApiInstanceForNode } from '@paraspell/sdk';
import createDexNodeInstance from '../dexNodes/DexNodeFactory';
import {
  type TBuildTransferExtrinsicsOptions,
  type TBuildTransferExtrinsicsResult,
  type TCommonTransferOptionsModified,
} from '../types';
import { validateRelayChainCurrency, calculateTransactionFee } from '../utils/utils';
import { selectBestExchange } from './selectBestExchange';
import { buildFromExchangeExtrinsic, buildToExchangeExtrinsic } from './utils';

export const buildTransferExtrinsics = async (
  options: TBuildTransferExtrinsicsOptions,
): Promise<TBuildTransferExtrinsicsResult> => {
  const dex =
    options.exchange !== undefined
      ? createDexNodeInstance(options.exchange)
      : await selectBestExchange(options);

  const modifiedOptions: TCommonTransferOptionsModified = {
    ...options,
    exchange: dex.node,
  };

  const { from, to, currencyFrom, currencyTo, amount, injectorAddress } = modifiedOptions;

  const originApi = await createApiInstanceForNode(from);
  validateRelayChainCurrency(from, currencyFrom);
  validateRelayChainCurrency(to, currencyTo);
  const swapApi = await dex.createApiInstance();
  const toDestTxForSwap = await buildFromExchangeExtrinsic(swapApi, modifiedOptions, amount);
  const toDestTransactionFee = await calculateTransactionFee(toDestTxForSwap, injectorAddress);
  const toExchangeTx = await buildToExchangeExtrinsic(originApi, modifiedOptions);
  const toExchangeTransactionFee = await calculateTransactionFee(toExchangeTx, injectorAddress);
  const { amountOut, tx: swapTx } = await dex.swapCurrency(
    swapApi,
    options,
    toDestTransactionFee,
    toExchangeTransactionFee,
  );
  const toDestTx = await buildFromExchangeExtrinsic(swapApi, modifiedOptions, amountOut);
  return { txs: [toExchangeTx, swapTx, toDestTx], exchangeNode: dex.node };
};
