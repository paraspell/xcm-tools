import type { TAssetInfo } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import { createExchangeInstance } from '../exchanges/ExchangeChainFactory';
import type { TGetBestAmountOutOptions, TRouterAsset } from '../types';
import { getBestAmountOut } from './getBestAmountOut';
import { selectBestExchangeAmountOut } from './selectBestExchangeAmountOut';
import { resolveAssets } from './utils/resolveAssets';

vi.mock('../exchanges/ExchangeChainFactory');
vi.mock('./selectBestExchangeAmountOut');
vi.mock('./utils/resolveAssets');

describe('getBestAmountOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use createExchangeInstance when exchange is provided', async () => {
    const options = {
      exchange: 'EXCHANGE_A',
      amount: 100,
      currencyFrom: 'BTC',
      currencyTo: 'ETH',
      from: undefined,
      to: undefined,
    } as unknown as TGetBestAmountOutOptions;

    const fakeDex = {
      exchangeChain: 'EXCHANGE_A_CHAIN',
      createApiInstance: vi.fn().mockResolvedValue('api_instance'),
      createApiInstancePapi: vi.fn().mockResolvedValue('api_instance_papi'),
      getAmountOut: vi.fn().mockResolvedValue(200),
    } as unknown as ExchangeChain;

    vi.mocked(createExchangeInstance).mockReturnValue(fakeDex);
    vi.mocked(selectBestExchangeAmountOut).mockResolvedValue({} as ExchangeChain);

    const fakeAssets = {
      assetFromOrigin: { symbol: 'BTC' } as TAssetInfo,
      assetFromExchange: { symbol: 'BTC_EXCHANGE' } as TRouterAsset,
      assetTo: { symbol: 'ETH_EXCHANGE' } as TRouterAsset,
      feeAssetFromOrigin: undefined,
      feeAssetFromExchange: undefined,
    };
    vi.mocked(resolveAssets).mockReturnValue(fakeAssets);

    const createApiSpy = vi.spyOn(fakeDex, 'createApiInstance');
    const getAmountOutSpy = vi.spyOn(fakeDex, 'getAmountOut');

    const result = await getBestAmountOut(options);

    expect(createExchangeInstance).toHaveBeenCalledWith('EXCHANGE_A');
    expect(selectBestExchangeAmountOut).not.toHaveBeenCalled();
    expect(resolveAssets).toHaveBeenCalledWith(fakeDex, options);
    expect(createApiSpy).toHaveBeenCalled();
    expect(getAmountOutSpy).toHaveBeenCalledWith('api_instance', {
      assetFrom: fakeAssets.assetFromExchange,
      assetTo: fakeAssets.assetTo,
      amount: 100n,
      papiApi: 'api_instance_papi',
    });
    expect(result).toEqual({
      exchange: fakeDex.exchangeChain,
      amountOut: 200,
    });
  });

  it('should use selectBestExchangeAmountOut when exchange is not provided', async () => {
    const options = {
      exchange: undefined,
      amount: 50,
      currencyFrom: 'USD',
      currencyTo: 'EUR',
      from: undefined,
      to: undefined,
    } as unknown as TGetBestAmountOutOptions;

    const fakeDex = {
      exchangeChain: 'EXCHANGE_CHAIN_B',
      createApiInstance: vi.fn().mockResolvedValue('api_instance_b'),
      createApiInstancePapi: vi.fn().mockResolvedValue('api_instance_papi_b'),
      getAmountOut: vi.fn().mockResolvedValue(75),
    } as unknown as ExchangeChain;

    vi.mocked(selectBestExchangeAmountOut).mockResolvedValue(fakeDex);
    vi.mocked(createExchangeInstance).mockReturnValue({} as ExchangeChain);

    const fakeAssets = {
      assetFromOrigin: { symbol: 'BTC' } as TAssetInfo,
      assetFromExchange: { symbol: 'USD_EXCHANGE' } as TRouterAsset,
      assetTo: { symbol: 'EUR_EXCHANGE' } as TRouterAsset,
      feeAssetFromOrigin: undefined,
      feeAssetFromExchange: undefined,
    };
    vi.mocked(resolveAssets).mockReturnValue(fakeAssets);

    const createApiSpy = vi.spyOn(fakeDex, 'createApiInstance');
    const getAmountOutSpy = vi.spyOn(fakeDex, 'getAmountOut');

    const result = await getBestAmountOut(options);

    expect(selectBestExchangeAmountOut).toHaveBeenCalledWith(options, undefined, undefined);
    expect(createExchangeInstance).not.toHaveBeenCalled();
    expect(resolveAssets).toHaveBeenCalledWith(fakeDex, options);
    expect(createApiSpy).toHaveBeenCalled();
    expect(getAmountOutSpy).toHaveBeenCalledWith('api_instance_b', {
      assetFrom: fakeAssets.assetFromExchange,
      assetTo: fakeAssets.assetTo,
      amount: 50n,
      papiApi: 'api_instance_papi_b',
    });
    expect(result).toEqual({
      exchange: fakeDex.exchangeChain,
      amountOut: 75,
    });
  });
});
