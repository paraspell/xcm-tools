import type { TBuilderConfig, TUrl } from '@paraspell/sdk-core';

import type ExchangeChain from '../../exchanges/ExchangeChain';
import type { TExchangeApiVariant, TExchangeInfo } from '../../types';

export const buildExchangeApiVariant = async (
  dex: ExchangeChain,
  builderOptions: TBuilderConfig<TUrl> | undefined,
): Promise<TExchangeApiVariant> => {
  if (dex.apiType === 'PAPI') {
    return {
      apiType: 'PAPI',
      apiPapi: await dex.createApiInstancePapi(builderOptions),
    };
  }
  if (dex.apiType === 'PJS') {
    return {
      apiType: 'PJS',
      apiPjs: await dex.createApiInstance(builderOptions),
    };
  }
  return { apiType: 'GENERIC' };
};

export const pickExchangeApiVariant = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  exchange: TExchangeInfo<TApi, TRes, TSigner, TCustomChain>,
): TExchangeApiVariant => {
  if (exchange.apiType === 'PAPI') {
    return { apiType: 'PAPI', apiPapi: exchange.apiPapi };
  }
  if (exchange.apiType === 'PJS') {
    return { apiType: 'PJS', apiPjs: exchange.apiPjs };
  }
  return { apiType: 'GENERIC' };
};
