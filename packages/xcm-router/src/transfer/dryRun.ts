import type { TBypassOptions, TChain, TCurrencyCore } from '@paraspell/sdk';
import { dryRun, getFailureInfo, InvalidParameterError } from '@paraspell/sdk';

import type {
  TBuildTransactionsOptions,
  TBuildTransactionsOptionsModified,
  TRouterBuilderOptions,
  TRouterDryRunResult,
  TRouterPlan,
  TTransaction,
} from '../types';
import { buildTransactions } from './buildTransactions';
import { prepareTransformedOptions, validateTransferOptions } from './utils';

const assignIsExchange = (
  result: TRouterDryRunResult,
  options: TBuildTransactionsOptionsModified,
) => {
  const { origin, exchange, destination } = options;

  if (!origin) {
    result.origin.isExchange = true;
  }

  if (!destination && result.destination) {
    result.destination.isExchange = true;
  }

  result.hops = result.hops.map((hop) => ({
    ...hop,
    isExchange: hop.chain === exchange.baseChain,
  }));

  return result;
};

const dryRunTransaction = async (
  options: TBuildTransactionsOptionsModified,
  transaction: TTransaction,
  destChain?: TChain,
  bypassOptions?: TBypassOptions,
): Promise<TRouterDryRunResult> => {
  const {
    exchange,
    senderAddress,
    evmSenderAddress,
    recipientAddress,
    destination,
    currencyFrom,
    currencyTo,
    amount,
  } = options;
  const { api, tx, chain } = transaction;

  const address = recipientAddress ?? senderAddress;
  const senderAddressResolved = evmSenderAddress ?? senderAddress;
  const resolvedDest = destChain ?? destination?.chain ?? exchange.baseChain;

  return dryRun({
    api,
    tx,
    origin: chain,
    destination: resolvedDest,
    senderAddress: senderAddressResolved,
    address,
    swapConfig: {
      currencyTo: currencyTo as TCurrencyCore,
      exchangeChain: exchange.baseChain,
    },
    currency: {
      ...currencyFrom,
      amount: BigInt(amount),
    },
    bypassOptions,
  });
};

const mergeDryRunResults = (
  options: TBuildTransactionsOptionsModified,
  originResult: TRouterDryRunResult,
  exchangeResult: TRouterDryRunResult,
): TRouterDryRunResult => {
  const { exchange, destination } = options;

  const result: TRouterDryRunResult = {
    origin: originResult.origin,
    destination: destination ? exchangeResult.destination : exchangeResult.origin,
    hops: [
      ...originResult.hops,
      ...(destination ? [{ chain: exchange.baseChain, result: exchangeResult.origin }] : []),
      ...exchangeResult.hops,
    ],
  };

  return {
    ...getFailureInfo(result),
    ...result,
  };
};

const dryRun2Transactions = async (
  options: TBuildTransactionsOptionsModified,
  transactions: TRouterPlan,
): Promise<TRouterDryRunResult> => {
  const { exchange } = options;

  const [firstTx, secondTx] = transactions;

  const firstRes = await dryRunTransaction(options, firstTx, exchange.baseChain);

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

const dryRunTransactions = (
  transactions: TRouterPlan,
  options: TBuildTransactionsOptionsModified,
) => {
  if (transactions.length === 1) {
    return dryRunTransaction(options, transactions[0]);
  }

  if (transactions.length === 2) {
    return dryRun2Transactions(options, transactions);
  }

  throw new InvalidParameterError('Router dry run supports up to two transactions per flow.');
};

export const dryRunRouter = async (
  initialOptions: TBuildTransactionsOptions,
  builderOptions?: TRouterBuilderOptions,
): Promise<TRouterDryRunResult> => {
  validateTransferOptions(initialOptions);
  const { options, dex } = await prepareTransformedOptions(initialOptions, builderOptions);
  const routerPlan = await buildTransactions(dex, options);

  const result = await dryRunTransactions(routerPlan, options);

  return assignIsExchange(result, options);
};
