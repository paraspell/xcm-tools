import { describe, it, expect, vi } from 'vitest';
import BigNumber from 'bignumber.js';
import { selectBestExchangeAmountOut } from './selectBestExchangeAmountOut';
import { selectBestExchangeCommon } from './selectBestExchangeCommon';
import type ExchangeNode from '../dexNodes/DexNode';
import type { TGetBestAmountOutOptions, TRouterAsset } from '../types';

vi.mock('./selectBestExchangeCommon', () => ({
  selectBestExchangeCommon: vi.fn(),
}));

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
      getAmountOut: vi.fn().mockResolvedValue('300'),
      node: 'dummyDex',
      exchangeNode: 'dummyExchange',
    } as unknown as ExchangeNode;

    const mockedSelectBestExchangeCommon = vi.mocked(selectBestExchangeCommon);
    mockedSelectBestExchangeCommon.mockImplementation(async (options, computeAmountOut) => {
      const result = await computeAmountOut(
        fakeDex,
        'assetFrom' as unknown as TRouterAsset,
        'assetTo' as unknown as TRouterAsset,
        options,
      );
      expect(result instanceof BigNumber).toBe(true);
      expect(result.toString()).toBe('300');
      return fakeDex;
    });

    const createApiSpy = vi.spyOn(fakeDex, 'createApiInstance');
    const getAmountOutSpy = vi.spyOn(fakeDex, 'getAmountOut');

    const bestExchange = await selectBestExchangeAmountOut(mockOptions);
    expect(bestExchange).toBe(fakeDex);
    expect(createApiSpy).toHaveBeenCalledTimes(1);
    expect(getAmountOutSpy).toHaveBeenCalledWith('fakeApi', {
      assetFrom: 'assetFrom',
      assetTo: 'assetTo',
      amount: mockOptions.amount,
    });
  });

  it('should propagate errors thrown by selectBestExchangeCommon', async () => {
    const testError = new Error('Test error');
    const mockedSelectBestExchangeCommon = vi.mocked(selectBestExchangeCommon);
    mockedSelectBestExchangeCommon.mockRejectedValue(testError);
    await expect(selectBestExchangeAmountOut(mockOptions)).rejects.toThrow('Test error');
  });
});
