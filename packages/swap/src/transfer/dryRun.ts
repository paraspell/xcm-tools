import type {
  TBypassOptions,
  TChain,
  TDryRunPreviewOptions,
  TDryRunResult,
  WithApi,
} from '@paraspell/sdk-core';
import {
  assertCurrencyCore,
  dryRun,
  getDryRunError,
  UnsupportedOperationError,
} from '@paraspell/sdk-core';

import type {
  TBuildTransactionsOptions,
  TRouterPlan,
  TTransaction,
  TTransformedOptions,
} from '../types';
import { buildTransactions } from './buildTransactions';
import { prepareTransformedOptions, validateTransferOptions } from './utils';

const assignIsExchange = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  result: TDryRunResult,
  options: TTransformedOptions<
    TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>,
    TApi,
    TRes,
    TSigner,
    TCustomChain
  >,
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

const dryRunTransaction = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TTransformedOptions<
    TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>,
    TApi,
    TRes,
    TSigner,
    TCustomChain
  >,
  transaction: TTransaction<TApi, TRes>,
  destChain?: TChain,
  bypassOptions?: TBypassOptions,
): Promise<TDryRunResult> => {
  const { api, exchange, sender, evmSenderAddress, destination, currencyFrom, currencyTo, amount } =
    options;
  const { tx, chain } = transaction;

  assertCurrencyCore(currencyTo);

  const senderResolved = evmSenderAddress ?? sender;
  const resolvedDest = destChain ?? destination?.chain ?? exchange.chain;

  return dryRun({
    api: api.clone(),
    tx,
    origin: chain,
    destination: resolvedDest,
    sender: senderResolved,
    swapConfig: {
      currencyTo,
      exchangeChain: exchange.chain,
    },
    currency: {
      ...currencyFrom,
      amount: BigInt(amount),
    },
    bypassOptions,
  });
};

const mergeDryRunResults = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TTransformedOptions<
    TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>,
    TApi,
    TRes,
    TSigner,
    TCustomChain
  >,
  originResult: TDryRunResult,
  exchangeResult: TDryRunResult,
): TDryRunResult => {
  const { exchange, destination } = options;

  const result: Omit<TDryRunResult, 'success'> = {
    origin: originResult.origin,
    destination: destination ? exchangeResult.destination : exchangeResult.origin,
    hops: [
      ...originResult.hops,
      ...(destination ? [{ chain: exchange.chain, result: exchangeResult.origin }] : []),
      ...exchangeResult.hops,
    ],
  };

  const dryRunError = getDryRunError(result);

  return {
    success: !dryRunError,
    dryRunError,
    ...result,
  };
};

const dryRun2Transactions = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TTransformedOptions<
    TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>,
    TApi,
    TRes,
    TSigner,
    TCustomChain
  >,
  transactions: TRouterPlan<TApi, TRes>,
  originBypass?: TBypassOptions,
  exchangeBypass?: TBypassOptions,
): Promise<TDryRunResult> => {
  const { exchange } = options;

  const [firstTx, secondTx] = transactions;

  const firstRes = await dryRunTransaction(options, firstTx, exchange.chain, originBypass);

  const exchangeBypassOptions: TBypassOptions | undefined =
    exchangeBypass ??
    (firstRes.success
      ? {
          sentAssetMintMode: 'preview',
          mintFeeAssets: originBypass?.mintFeeAssets ?? false,
        }
      : undefined);

  const secondRes = await dryRunTransaction(options, secondTx, undefined, exchangeBypassOptions);

  return mergeDryRunResults(options, firstRes, secondRes);
};

export const dryRunTransactions = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  transactions: TRouterPlan<TApi, TRes>,
  options: TTransformedOptions<
    TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>,
    TApi,
    TRes,
    TSigner,
    TCustomChain
  >,
  originBypass?: TBypassOptions,
  exchangeBypass?: TBypassOptions,
) => {
  if (transactions.length === 1) {
    return dryRunTransaction(options, transactions[0], undefined, originBypass);
  }

  if (transactions.length === 2) {
    return dryRun2Transactions(options, transactions, originBypass, exchangeBypass);
  }

  throw new UnsupportedOperationError('Router dry run supports up to two transactions per flow.');
};

const runDryRun = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  initialOptions: WithApi<
    TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>,
    TApi,
    TRes,
    TSigner,
    TCustomChain
  >,
  originBypassOptions?: TBypassOptions,
): Promise<TDryRunResult> => {
  validateTransferOptions(initialOptions);
  const { options, dex } = await prepareTransformedOptions(initialOptions);
  const routerPlan = await buildTransactions(dex, options);

  const result = await dryRunTransactions(routerPlan, options, originBypassOptions);

  return assignIsExchange(result, options);
};

export const dryRunRouter = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  initialOptions: WithApi<
    TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>,
    TApi,
    TRes,
    TSigner,
    TCustomChain
  >,
): Promise<TDryRunResult> => runDryRun(initialOptions);

export const dryRunRouterPreview = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  initialOptions: WithApi<
    TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>,
    TApi,
    TRes,
    TSigner,
    TCustomChain
  >,
  previewOptions?: TDryRunPreviewOptions,
): Promise<TDryRunResult> =>
  runDryRun(initialOptions, {
    sentAssetMintMode: 'preview',
    mintFeeAssets: previewOptions?.mintFeeAssets,
  });
