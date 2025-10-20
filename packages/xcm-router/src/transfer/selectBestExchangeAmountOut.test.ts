import { describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TGetBestAmountOutOptions, TRouterAsset } from '../types';
import { selectBestExchangeAmountOut } from './selectBestExchangeAmountOut';
import { selectBestExchangeCommon } from './selectBestExchangeCommon';

vi.mock('./selectBestExchangeCommon');

describe('selectBestExchangeAmountOut', () => {
  const mockOptions = {
    from: 'fromDex',
    to: 'toDex',
    currencyFrom: { symbol: 'AAA' },
    currencyTo: { symbol: 'BBB' },
    amount: 10,
  } as unknown as TGetBestAmountOutOptions;

  it('should compute the amount out using the dex callback and return the best exchange', async () => {
    const fakeDex = {
      createApiInstance: vi.fn().mockResolvedValue('fakeApi'),
      createApiInstancePapi: vi.fn().mockResolvedValue('fakePapiApi'),
      getAmountOut: vi.fn().mockResolvedValue(300n),
      chain: 'dummyDex',
      exchangeChain: 'dummyExchange',
    } as unknown as ExchangeChain;

    vi.mocked(selectBestExchangeCommon).mockImplementation(
      async (options, _originApi, computeAmountOut) => {
        const result = await computeAmountOut(
          fakeDex,
          'assetFrom' as unknown as TRouterAsset,
          'assetTo' as unknown as TRouterAsset,
          options,
        );
        expect(result).toBe(300n);
        return fakeDex;
      },
    );

    const createApiSpy = vi.spyOn(fakeDex, 'createApiInstance');
    const getAmountOutSpy = vi.spyOn(fakeDex, 'getAmountOut');

    const originApi = undefined;

    const bestExchange = await selectBestExchangeAmountOut(mockOptions, originApi);
    expect(bestExchange).toBe(fakeDex);
    expect(createApiSpy).toHaveBeenCalledTimes(1);
    expect(getAmountOutSpy).toHaveBeenCalledWith('fakeApi', {
      assetFrom: 'assetFrom',
      assetTo: 'assetTo',
      amount: BigInt(mockOptions.amount),
      papiApi: 'fakePapiApi',
    });
  });

  it('should propagate errors thrown by selectBestExchangeCommon', async () => {
    const testError = new Error('Test error');
    vi.mocked(selectBestExchangeCommon).mockRejectedValue(testError);
    await expect(selectBestExchangeAmountOut(mockOptions, undefined)).rejects.toThrow('Test error');
  });
});
