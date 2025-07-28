import type { TAssetInfo } from '@paraspell/sdk-pjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeNode from '../dexNodes/DexNode';
import { createDexNodeInstance } from '../dexNodes/DexNodeFactory';
import type { TGetBestAmountOutOptions, TRouterAsset } from '../types';
import { getBestAmountOut } from './getBestAmountOut';
import { selectBestExchangeAmountOut } from './selectBestExchangeAmountOut';
import { resolveAssets } from './utils/resolveAssets';

vi.mock('../dexNodes/DexNodeFactory', () => ({
  createDexNodeInstance: vi.fn(),
}));

vi.mock('./selectBestExchangeAmountOut', () => ({
  selectBestExchangeAmountOut: vi.fn(),
}));

vi.mock('./utils/resolveAssets', () => ({
  resolveAssets: vi.fn(),
}));

describe('getBestAmountOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use createDexNodeInstance when exchange is provided', async () => {
    const options = {
      exchange: 'EXCHANGE_A',
      amount: 100,
      currencyFrom: 'BTC',
      currencyTo: 'ETH',
      from: undefined,
      to: undefined,
    } as unknown as TGetBestAmountOutOptions;

    const fakeDex = {
      exchangeNode: 'EXCHANGE_A_NODE',
      createApiInstance: vi.fn().mockResolvedValue('api_instance'),
      createApiInstancePapi: vi.fn().mockResolvedValue('api_instance_papi'),
      getAmountOut: vi.fn().mockResolvedValue(200),
    } as unknown as ExchangeNode;

    vi.mocked(createDexNodeInstance).mockReturnValue(fakeDex);
    vi.mocked(selectBestExchangeAmountOut).mockResolvedValue({} as ExchangeNode);

    const fakeAssets = {
      assetFromOrigin: { symbol: 'BTC' } as TAssetInfo,
      assetFromExchange: { symbol: 'BTC_EXCHANGE' } as TRouterAsset,
      assetTo: { symbol: 'ETH_EXCHANGE' } as TRouterAsset,
    };
    vi.mocked(resolveAssets).mockReturnValue(fakeAssets);

    const createApiSpy = vi.spyOn(fakeDex, 'createApiInstance');
    const getAmountOutSpy = vi.spyOn(fakeDex, 'getAmountOut');

    const result = await getBestAmountOut(options);

    expect(createDexNodeInstance).toHaveBeenCalledWith('EXCHANGE_A');
    expect(selectBestExchangeAmountOut).not.toHaveBeenCalled();
    expect(resolveAssets).toHaveBeenCalledWith(fakeDex, options);
    expect(createApiSpy).toHaveBeenCalled();
    expect(getAmountOutSpy).toHaveBeenCalledWith('api_instance', {
      assetFrom: fakeAssets.assetFromExchange,
      assetTo: fakeAssets.assetTo,
      amount: 100,
      papiApi: 'api_instance_papi',
    });
    expect(result).toEqual({
      exchange: fakeDex.exchangeNode,
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
      exchangeNode: 'EXCHANGE_NODE_B',
      createApiInstance: vi.fn().mockResolvedValue('api_instance_b'),
      createApiInstancePapi: vi.fn().mockResolvedValue('api_instance_papi_b'),
      getAmountOut: vi.fn().mockResolvedValue(75),
    } as unknown as ExchangeNode;

    vi.mocked(selectBestExchangeAmountOut).mockResolvedValue(fakeDex);
    vi.mocked(createDexNodeInstance).mockReturnValue({} as ExchangeNode);

    const fakeAssets = {
      assetFromOrigin: { symbol: 'BTC' } as TAssetInfo,
      assetFromExchange: { symbol: 'USD_EXCHANGE' } as TRouterAsset,
      assetTo: { symbol: 'EUR_EXCHANGE' } as TRouterAsset,
    };
    vi.mocked(resolveAssets).mockReturnValue(fakeAssets);

    const createApiSpy = vi.spyOn(fakeDex, 'createApiInstance');
    const getAmountOutSpy = vi.spyOn(fakeDex, 'getAmountOut');

    const result = await getBestAmountOut(options);

    expect(selectBestExchangeAmountOut).toHaveBeenCalledWith(options, undefined);
    expect(createDexNodeInstance).not.toHaveBeenCalled();
    expect(resolveAssets).toHaveBeenCalledWith(fakeDex, options);
    expect(createApiSpy).toHaveBeenCalled();
    expect(getAmountOutSpy).toHaveBeenCalledWith('api_instance_b', {
      assetFrom: fakeAssets.assetFromExchange,
      assetTo: fakeAssets.assetTo,
      amount: 50,
      papiApi: 'api_instance_papi_b',
    });
    expect(result).toEqual({
      exchange: fakeDex.exchangeNode,
      amountOut: 75,
    });
  });
});
