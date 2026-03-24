import {
  applyDecimalAbstraction,
  convertBuilderConfig,
  UnsupportedOperationError,
} from '@paraspell/sdk-core';

import { supportsExchangePair } from '../../assets';
import type ExchangeChain from '../../exchanges/ExchangeChain';
import { createExchangeInstance } from '../../exchanges/ExchangeChainFactory';
import type { TCommonRouterOptions, TTransformedOptions } from '../../types';
import { selectBestExchange } from '../selectBestExchange';
import { resolveAssets } from './resolveAssets';
import { determineFeeCalcAddress } from './utils';

export const prepareTransformedOptions = async <TApi, TRes, TSigner>(
  options: TCommonRouterOptions<TApi, TRes, TSigner>,
  isForFeeEstimation = false,
): Promise<{
  dex: ExchangeChain;
  options: TTransformedOptions<TCommonRouterOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>;
}> => {
  const { api, from, to, exchange, sender, recipient, amount } = options;

  const originApi = from ? await api.createApiForChain(from) : undefined;

  const dex =
    exchange !== undefined && !Array.isArray(exchange)
      ? createExchangeInstance(exchange)
      : await selectBestExchange(options, originApi?.getApi(), isForFeeEstimation);

  const { assetFromOrigin, assetFromExchange, assetTo, feeAssetFromOrigin, feeAssetFromExchange } =
    resolveAssets(dex, options);

  if (!supportsExchangePair(dex.exchangeChain, assetFromExchange, assetTo)) {
    throw new UnsupportedOperationError(
      `Exchange ${dex.chain} does not support the pair ${assetFromExchange.symbol} -> ${assetTo.symbol}`,
    );
  }

  const originSpecified = from && originApi && from !== dex.chain;
  const destinationSpecified = to && to !== dex.chain;

  const exchangeApi = await api.createApiForChain(dex.chain);

  const config = api.getConfig();
  const exchangeConfig = convertBuilderConfig<TApi>(config);

  const transformed = {
    ...options,
    amount: applyDecimalAbstraction(
      amount,
      assetFromOrigin?.decimals ?? assetFromExchange.decimals,
      exchangeConfig?.abstractDecimals !== false,
    ),
    origin:
      originSpecified && assetFromOrigin && originApi
        ? {
            api: originApi.getApi(),
            chain: from,
            assetFrom: assetFromOrigin,
            feeAssetInfo: feeAssetFromOrigin,
          }
        : undefined,
    exchange: {
      apiPjs: await dex.createApiInstance(exchangeConfig),
      apiPapi: await dex.createApiInstancePapi(exchangeConfig),
      api: exchangeApi,
      baseChain: dex.chain,
      exchangeChain: dex.exchangeChain,
      assetFrom: assetFromExchange,
      assetTo,
      feeAssetInfo: feeAssetFromExchange,
    },
    destination:
      destinationSpecified && recipient
        ? {
            chain: to,
            address: recipient,
          }
        : undefined,
    feeCalcAddress: determineFeeCalcAddress(sender, recipient),
  };

  return {
    dex,
    options: transformed,
  };
};
