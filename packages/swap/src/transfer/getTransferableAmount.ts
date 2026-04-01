import type { TCurrencyCore, WithApi } from '@paraspell/sdk-core';
import {
  getBalance,
  getExistentialDepositOrThrow,
  getNativeAssetSymbol,
} from '@paraspell/sdk-core';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions } from '../types';
import type { TTransformedOptions } from '../types/TRouter';
import { getSwapFee } from './fees';
import {
  createToExchangeBuilder,
  prepareTransformedOptions,
  validateTransferOptions,
} from './utils';

const computeLocalTransferableAmount = async <TApi, TRes, TSigner>(
  dex: ExchangeChain,
  options: TTransformedOptions<TBuildTransactionsOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>,
): Promise<bigint> => {
  const { exchange, sender } = options;

  const currency: TCurrencyCore = {
    location: exchange.assetFrom.location,
  };

  const balance = await getBalance({
    api: exchange.api,
    chain: exchange.chain,
    address: sender,
    currency,
  });

  const existentialDeposit = getExistentialDepositOrThrow(exchange.chain, currency);

  let swapFee = 0n;
  const nativeSymbol = getNativeAssetSymbol(exchange.chain);

  if (exchange.assetFrom.symbol === nativeSymbol) {
    const { result } = await getSwapFee(dex, options);
    swapFee = result.fee ?? 0n;
  }

  const transferable = balance - existentialDeposit - swapFee;
  return transferable > 0n ? transferable : 0n;
};

export const getTransferableAmount = async <TApi, TRes, TSigner>(
  initialOptions: WithApi<TBuildTransactionsOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>,
): Promise<bigint> => {
  validateTransferOptions(initialOptions);

  const { dex, options } = await prepareTransformedOptions(initialOptions);
  const transformedOptions = options;

  if (
    transformedOptions.origin &&
    transformedOptions.origin.chain !== transformedOptions.exchange.chain
  ) {
    const builder = createToExchangeBuilder({
      origin: transformedOptions.origin,
      exchange: transformedOptions.exchange,
      sender: transformedOptions.sender,
      evmSenderAddress: transformedOptions.evmSenderAddress,
      amount: transformedOptions.amount,
      api: transformedOptions.api,
    });

    return builder.getTransferableAmount();
  }

  return computeLocalTransferableAmount(dex, transformedOptions);
};
