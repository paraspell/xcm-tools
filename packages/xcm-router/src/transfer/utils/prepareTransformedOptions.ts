import { applyDecimalAbstraction, createChainClient, InvalidParameterError } from '@paraspell/sdk';

import { supportsExchangePair } from '../../assets';
import type ExchangeChain from '../../exchanges/ExchangeChain';
import { createExchangeInstance } from '../../exchanges/ExchangeChainFactory';
import type { TAdditionalTransferOptions, TRouterBuilderOptions } from '../../types';
import { type TBuildTransactionsOptions, type TTransferOptions } from '../../types';
import { selectBestExchange } from '../selectBestExchange';
import { resolveAssets } from './resolveAssets';
import { determineFeeCalcAddress } from './utils';

export const prepareTransformedOptions = async <
  T extends TTransferOptions | TBuildTransactionsOptions,
>(
  options: T,
  builderOptions?: TRouterBuilderOptions,
): Promise<{ dex: ExchangeChain; options: T & TAdditionalTransferOptions }> => {
  const { from, to, exchange, senderAddress, recipientAddress, amount } = options;

  const originApi = from ? await createChainClient(from, builderOptions) : undefined;

  const dex =
    exchange !== undefined && !Array.isArray(exchange)
      ? createExchangeInstance(exchange)
      : await selectBestExchange(options, originApi, builderOptions);

  const { assetFromOrigin, assetFromExchange, assetTo } = resolveAssets(dex, options);

  if (!supportsExchangePair(dex.exchangeChain, assetFromExchange, assetTo)) {
    throw new InvalidParameterError(
      `Exchange ${dex.chain} does not support the pair ${assetFromExchange.symbol} -> ${assetTo.symbol}`,
    );
  }

  const originSpecified = from && originApi && from !== dex.chain;
  const destinationSpecified = to && to !== dex.chain;

  const transformed = {
    ...options,
    amount: applyDecimalAbstraction(
      amount,
      assetFromOrigin?.decimals ?? assetFromExchange.decimals,
      !!builderOptions?.abstractDecimals,
    ),
    origin:
      originSpecified && assetFromOrigin
        ? {
            api: originApi,
            chain: from,
            assetFrom: assetFromOrigin,
          }
        : undefined,
    exchange: {
      api: await dex.createApiInstance(builderOptions),
      apiPapi: await dex.createApiInstancePapi(builderOptions),
      baseChain: dex.chain,
      exchangeChain: dex.exchangeChain,
      assetFrom: assetFromExchange,
      assetTo,
    },
    destination:
      destinationSpecified && recipientAddress
        ? {
            chain: to,
            address: recipientAddress,
          }
        : undefined,
    feeCalcAddress: determineFeeCalcAddress(senderAddress, recipientAddress),
    builderOptions,
  };

  return {
    dex,
    options: transformed,
  };
};
