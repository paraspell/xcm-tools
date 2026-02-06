import { getExistentialDepositOrThrow, getNativeAssetSymbol } from '@paraspell/sdk';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TRouterBuilderOptions } from '../types';
import type { TTransformedOptions } from '../types/TRouter';
import { getSwapFee } from './fees';
import {
  createToExchangeBuilder,
  prepareTransformedOptions,
  validateTransferOptions,
} from './utils';

const computeExchangeMinAmount = async (
  dex: ExchangeChain,
  options: TTransformedOptions<TBuildTransactionsOptions>,
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

export const getMinTransferableAmount = async (
  initialOptions: TBuildTransactionsOptions,
  builderOptions?: TRouterBuilderOptions,
): Promise<bigint> => {
  validateTransferOptions(initialOptions);

  const { dex, options } = await prepareTransformedOptions(initialOptions, builderOptions);

  const { origin, exchange, senderAddress, evmSenderAddress, amount } = options;

  if (origin) {
    const builder = createToExchangeBuilder({
      origin,
      exchange,
      senderAddress,
      evmSenderAddress,
      amount,
      builderOptions,
    });

    return builder.getMinTransferableAmount();
  }

  return computeExchangeMinAmount(dex, options);
};
