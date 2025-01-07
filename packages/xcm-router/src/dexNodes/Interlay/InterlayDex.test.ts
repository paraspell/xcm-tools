import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BN } from '@polkadot/util';
import BigNumber from 'bignumber.js';
import { getAssets, getNodeProviders } from '@paraspell/sdk-pjs';
import type { CurrencyExt, InterBtcApi } from 'inter-exchange';
import { createInterBtcApi, newMonetaryAmount } from 'inter-exchange';
import { SmallAmountError } from '../../errors/SmallAmountError';
import type { ApiPromise } from '@polkadot/api';
import type { TSwapOptions } from '../../types';
import InterlayExchangeNode from './InterlayDex';
import { getCurrency } from './utils';

vi.mock('@paraspell/sdk-pjs', () => ({
  getAssets: vi.fn(),
  getNodeProviders: vi.fn(),
}));

vi.mock('inter-exchange', () => ({
  createInterBtcApi: vi.fn(),
  newMonetaryAmount: vi.fn(),
}));

vi.mock('./utils', () => ({
  getCurrency: vi.fn(),
}));

const mockInterBtcApi = {
  amm: {
    getLiquidityPools: vi.fn(),
    getOptimalTrade: vi.fn(),
    swap: vi.fn(),
  },
};

describe('InterlayExchangeNode', () => {
  let interlayExchangeNode: InterlayExchangeNode;
  let apiMock: Partial<ApiPromise>;

  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(getNodeProviders).mockReturnValue(['FakeProviderURL']);
    vi.mocked(createInterBtcApi).mockResolvedValue(mockInterBtcApi as unknown as InterBtcApi);
    mockInterBtcApi.amm.getLiquidityPools.mockResolvedValue(['mockLiquidityPool']);
    mockInterBtcApi.amm.swap.mockReturnValue({ extrinsic: 'mockExtrinsic' });

    mockInterBtcApi.amm.getOptimalTrade.mockReturnValue({
      outputAmount: {
        toString: vi.fn().mockReturnValue('12345'),
      },
      getMinimumOutputAmount: vi.fn().mockReturnValue('minimumOutputAmount'),
    });

    vi.mocked(getCurrency).mockResolvedValue({ name: 'mockCurrency' } as CurrencyExt);
    vi.mocked(newMonetaryAmount).mockReturnValue(
      'mockMonetaryAmount' as unknown as ReturnType<typeof newMonetaryAmount>,
    );

    apiMock = {
      query: {
        system: {
          number: vi.fn().mockResolvedValue(new BN(1000)),
        },
      },
    } as unknown as Partial<ApiPromise>;

    interlayExchangeNode = new InterlayExchangeNode('Interlay', 'InterlayDex');
  });

  describe('swapCurrency', () => {
    it('throws if assetFrom is invalid', async () => {
      vi.mocked(getCurrency)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ name: 'mockCurrencyTo' } as CurrencyExt);

      const swapOptions = {
        injectorAddress: 'fake-address',
        assetFrom: { symbol: 'FAKE' },
        assetTo: { symbol: 'REAL' },
        currencyFrom: { symbol: 'FAKE' },
        currencyTo: { symbol: 'REAL' },
        amount: '100',
        slippagePct: '1',
      } as TSwapOptions;

      await expect(
        interlayExchangeNode.swapCurrency(
          apiMock as ApiPromise,
          swapOptions,
          BigNumber(0),
          BigNumber(1),
        ),
      ).rejects.toThrowError('Currency from is invalid.');
    });

    it('throws if assetTo is invalid', async () => {
      vi.mocked(getCurrency)
        .mockResolvedValueOnce({ name: 'mockCurrencyFrom' } as CurrencyExt)
        .mockResolvedValueOnce(null);

      const swapOptions = {
        injectorAddress: 'fake-address',
        assetFrom: { symbol: 'REAL' },
        assetTo: { symbol: 'FAKE' },
        currencyFrom: { symbol: 'REAL' },
        currencyTo: { symbol: 'FAKE' },
        amount: '100',
        slippagePct: '1',
      } as TSwapOptions;

      await expect(
        interlayExchangeNode.swapCurrency(
          apiMock as ApiPromise,
          swapOptions,
          new BigNumber(0),
          new BigNumber(1),
        ),
      ).rejects.toThrowError('Currency to is invalid.');
    });

    it('throws SmallAmountError if amount minus fees is negative', async () => {
      vi.mocked(getCurrency).mockResolvedValue({ name: 'mockCurrency' } as CurrencyExt);

      const swapOptions = {
        injectorAddress: 'fake-address',
        assetFrom: { symbol: 'REAL' },
        assetTo: { symbol: 'REAL2' },
        currencyFrom: { symbol: 'REAL' },
        currencyTo: { symbol: 'REAL2' },
        amount: '1',
        slippagePct: '1',
      } as TSwapOptions;

      await expect(
        interlayExchangeNode.swapCurrency(
          apiMock as ApiPromise,
          swapOptions,
          BigNumber(0),
          BigNumber(1),
        ),
      ).rejects.toThrowError(SmallAmountError);
    });

    it('throws if no trade is found', async () => {
      mockInterBtcApi.amm.getOptimalTrade.mockReturnValueOnce(null);

      const swapOptions = {
        injectorAddress: 'fake-address',
        assetFrom: { symbol: 'REAL' },
        assetTo: { symbol: 'REAL2' },
        currencyFrom: { symbol: 'REAL' },
        currencyTo: { symbol: 'REAL2' },
        amount: '100',
        slippagePct: '1',
      } as TSwapOptions;

      await expect(
        interlayExchangeNode.swapCurrency(
          apiMock as ApiPromise,
          swapOptions,
          BigNumber(0),
          BigNumber(1),
        ),
      ).rejects.toThrowError('No trade found');
    });

    it('returns a successful swap result', async () => {
      const swapOptions = {
        injectorAddress: 'fake-address',
        assetFrom: { symbol: 'REAL' },
        assetTo: { symbol: 'REAL2' },
        currencyFrom: { symbol: 'REAL' },
        currencyTo: { symbol: 'REAL2' },
        amount: '100',
        slippagePct: '1',
      } as TSwapOptions;

      const result = await interlayExchangeNode.swapCurrency(
        apiMock as ApiPromise,
        swapOptions,
        BigNumber(0),
        BigNumber(1),
      );

      expect(result).toBeTruthy();
      expect(result.tx).toBe('mockExtrinsic');
      // This depends on how you implement trade.outputAmount
      // We mocked getOptimalTrade to return outputAmount = '12345'
      expect(result.amountOut).toBe('12345');
    });
  });

  describe('getAssets', () => {
    it('transforms assets properly', async () => {
      vi.mocked(getAssets).mockReturnValue([
        {
          symbol: 'ABC',
          assetId: '1',
        },
        {
          symbol: 'XYZ',
          assetId: '2',
        },
      ]);

      const result = await interlayExchangeNode.getAssets(apiMock as ApiPromise);

      expect(result).toEqual([
        { symbol: 'ABC', id: '1' },
        { symbol: 'XYZ', id: '2' },
      ]);
    });
  });
});
