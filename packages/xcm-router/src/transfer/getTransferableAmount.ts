import type { TCurrencyCore } from '@paraspell/sdk';
import {
  getAssetBalance,
  getExistentialDepositOrThrow,
  getNativeAssetSymbol,
} from '@paraspell/sdk';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TRouterBuilderOptions } from '../types';
import type { TRouterAsset, TTransformedOptions } from '../types/TRouter';
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

const computeLocalTransferableAmount = async (
  dex: ExchangeChain,
  options: TTransformedOptions<TBuildTransactionsOptions>,
): Promise<bigint> => {
  const { exchange, senderAddress } = options;

  const currency = toCurrencyCore(exchange.assetFrom);

  const balance = await getAssetBalance({
    api: exchange.apiPapi,
    chain: exchange.baseChain,
    address: senderAddress,
    currency,
  });

  const existentialDeposit = getExistentialDepositOrThrow(exchange.baseChain, currency);

  let swapFee = 0n;
  const nativeSymbol = getNativeAssetSymbol(exchange.baseChain);

  if (exchange.assetFrom.symbol === nativeSymbol) {
    const { result } = await getSwapFee(dex, options);
    swapFee = result.fee ?? 0n;
  }

  const transferable = balance - existentialDeposit - swapFee;
  return transferable > 0n ? transferable : 0n;
};

export const getTransferableAmount = async (
  initialOptions: TBuildTransactionsOptions,
  builderOptions?: TRouterBuilderOptions,
): Promise<bigint> => {
  validateTransferOptions(initialOptions);

  const { dex, options } = await prepareTransformedOptions(initialOptions, builderOptions);
  const transformedOptions = options;

  if (
    transformedOptions.origin &&
    transformedOptions.origin.chain !== transformedOptions.exchange.baseChain
  ) {
    const builder = createToExchangeBuilder({
      origin: transformedOptions.origin,
      exchange: transformedOptions.exchange,
      senderAddress: transformedOptions.senderAddress,
      evmSenderAddress: transformedOptions.evmSenderAddress,
      amount: transformedOptions.amount,
      builderOptions,
    });

    return builder.getTransferableAmount();
  }

  return computeLocalTransferableAmount(dex, transformedOptions);
};
