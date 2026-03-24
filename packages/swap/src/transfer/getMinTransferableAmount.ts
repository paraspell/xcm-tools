import { getExistentialDepositOrThrow, getNativeAssetSymbol } from '@paraspell/sdk-core';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions } from '../types';
import type { TTransformedOptions } from '../types/TRouter';
import { getSwapFee } from './fees';
import {
  createToExchangeBuilder,
  prepareTransformedOptions,
  validateTransferOptions,
} from './utils';

const computeExchangeMinAmount = async <TApi, TRes, TSigner>(
  dex: ExchangeChain,
  options: TTransformedOptions<TBuildTransactionsOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>,
): Promise<bigint> => {
  const { exchange } = options;

  const existentialDeposit = getExistentialDepositOrThrow(exchange.baseChain, {
    location: exchange.assetFrom.location,
  });

  const nativeSymbol = getNativeAssetSymbol(exchange.baseChain);
  const isNativeAsset = exchange.assetFrom.symbol === nativeSymbol;

  if (!isNativeAsset) {
    return existentialDeposit + 1n;
  }

  const { result } = await getSwapFee(dex, options);
  const swapFee = result.fee ?? 0n;

  return existentialDeposit + swapFee + 1n;
};

export const getMinTransferableAmount = async <TApi, TRes, TSigner>(
  initialOptions: TBuildTransactionsOptions<TApi, TRes, TSigner>,
): Promise<bigint> => {
  validateTransferOptions(initialOptions);

  const { dex, options } = await prepareTransformedOptions(initialOptions);

  const { origin, exchange, sender, evmSenderAddress, amount, api } = options;

  if (origin) {
    const builder = createToExchangeBuilder({
      origin,
      exchange,
      sender,
      evmSenderAddress,
      amount,
      api,
    });

    return builder.getMinTransferableAmount();
  }

  return computeExchangeMinAmount(dex, options);
};
