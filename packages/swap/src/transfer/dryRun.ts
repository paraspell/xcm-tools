import type {
  TBypassOptions,
  TChain,
  TCurrencyCore,
  TDryRunResult,
  WithApi,
} from '@paraspell/sdk-core';
import { dryRun, getFailureInfo, UnsupportedOperationError } from '@paraspell/sdk-core';

import type {
  TBuildTransactionsOptions,
  TRouterPlan,
  TTransaction,
  TTransformedOptions,
} from '../types';
import { buildTransactions } from './buildTransactions';
import { prepareTransformedOptions, validateTransferOptions } from './utils';

const assignIsExchange = <TApi, TRes, TSigner>(
  result: TDryRunResult,
  options: TTransformedOptions<TBuildTransactionsOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>,
) => {
  const { origin, exchange, destination } = options;

  if (!origin) {
    result.origin.isExchange = true;
  }

  if (!destination && result.destination) {
    result.destination.isExchange = true;
  }

  result.hops = result.hops.map((hop) => {
    const isExchange = hop.chain === exchange.chain;
    return {
      ...hop,
      result: {
        ...hop.result,
        isExchange,
      },
      isExchange,
    };
  });

  return result;
};

const dryRunTransaction = async <TApi, TRes, TSigner>(
  options: TTransformedOptions<TBuildTransactionsOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>,
  transaction: TTransaction<TApi, TRes>,
  destChain?: TChain,
  bypassOptions?: TBypassOptions,
): Promise<TDryRunResult> => {
  const { api, exchange, sender, evmSenderAddress, destination, currencyFrom, currencyTo, amount } =
    options;
  const { tx, chain } = transaction;

  const senderResolved = evmSenderAddress ?? sender;
  const resolvedDest = destChain ?? destination?.chain ?? exchange.chain;

  return dryRun({
    api: api.clone(),
    tx,
    origin: chain,
    destination: resolvedDest,
    sender: senderResolved,
    swapConfig: {
      currencyTo: currencyTo as TCurrencyCore,
      exchangeChain: exchange.chain,
    },
    currency: {
      ...currencyFrom,
      amount: BigInt(amount),
    },
    bypassOptions,
  });
};

const mergeDryRunResults = <TApi, TRes, TSigner>(
  options: TTransformedOptions<TBuildTransactionsOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>,
  originResult: TDryRunResult,
  exchangeResult: TDryRunResult,
): TDryRunResult => {
  const { exchange, destination } = options;

  const result: TDryRunResult = {
    origin: originResult.origin,
    destination: destination ? exchangeResult.destination : exchangeResult.origin,
    hops: [
      ...originResult.hops,
      ...(destination ? [{ chain: exchange.chain, result: exchangeResult.origin }] : []),
      ...exchangeResult.hops,
    ],
  };

  return {
    ...getFailureInfo(result),
    ...result,
  };
};

const dryRun2Transactions = async <TApi, TRes, TSigner>(
  options: TTransformedOptions<TBuildTransactionsOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>,
  transactions: TRouterPlan<TApi, TRes>,
): Promise<TDryRunResult> => {
  const { exchange } = options;

  const [firstTx, secondTx] = transactions;

  const firstRes = await dryRunTransaction(options, firstTx, exchange.chain);

  const { failureReason } = getFailureInfo(firstRes);

  const bypassOptions: TBypassOptions | undefined = !failureReason
    ? {
        sentAssetMintMode: 'preview',
        mintFeeAssets: false,
      }
    : undefined;

  const secondRes = await dryRunTransaction(options, secondTx, undefined, bypassOptions);

  return mergeDryRunResults(options, firstRes, secondRes);
};

const dryRunTransactions = <TApi, TRes, TSigner>(
  transactions: TRouterPlan<TApi, TRes>,
  options: TTransformedOptions<TBuildTransactionsOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>,
) => {
  if (transactions.length === 1) {
    return dryRunTransaction(options, transactions[0]);
  }

  if (transactions.length === 2) {
    return dryRun2Transactions(options, transactions);
  }

  throw new UnsupportedOperationError('Router dry run supports up to two transactions per flow.');
};

export const dryRunRouter = async <TApi, TRes, TSigner>(
  initialOptions: WithApi<TBuildTransactionsOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>,
): Promise<TDryRunResult> => {
  validateTransferOptions(initialOptions);
  const { options, dex } = await prepareTransformedOptions(initialOptions);
  const routerPlan = await buildTransactions(dex, options);

  const result = await dryRunTransactions(routerPlan, options);

  return assignIsExchange(result, options);
};
