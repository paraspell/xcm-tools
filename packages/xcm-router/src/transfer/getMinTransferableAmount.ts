import type { TCurrencyCore } from '@paraspell/sdk';
import { getExistentialDepositOrThrow, getNativeAssetSymbol } from '@paraspell/sdk';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TRouterBuilderOptions } from '../types';
import type { TBuildTransactionsOptionsModified, TRouterAsset } from '../types/TRouter';
import { getSwapFee } from './fees';
import {
  createToExchangeBuilder,
  prepareTransformedOptions,
  validateTransferOptions,
} from './utils';

const toCurrencyCore = (asset: TRouterAsset): TCurrencyCore => {
  if (asset.location) {
    return { location: asset.location };
  }

  if (asset.assetId) {
    return { id: asset.assetId };
  }

  return { symbol: asset.symbol };
};

const computeExchangeMinAmount = async (
  dex: ExchangeChain,
  options: TBuildTransactionsOptionsModified,
): Promise<bigint> => {
  const { exchange } = options;

  const currency = toCurrencyCore(exchange.assetFrom);
  const existentialDeposit = getExistentialDepositOrThrow(exchange.baseChain, currency);

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
  const transformedOptions = options as TBuildTransactionsOptionsModified;

  if (transformedOptions.origin) {
    const builder = createToExchangeBuilder({
      origin: transformedOptions.origin,
      exchange: transformedOptions.exchange,
      senderAddress: transformedOptions.senderAddress,
      evmSenderAddress: transformedOptions.evmSenderAddress,
      amount: transformedOptions.amount,
      builderOptions,
    });

    return builder.getMinTransferableAmount();
  }

  return computeExchangeMinAmount(dex, transformedOptions);
};
