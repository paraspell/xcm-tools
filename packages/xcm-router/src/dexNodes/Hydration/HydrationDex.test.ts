import type { Asset } from '@galacticcouncil/sdk';
import { TradeRouter } from '@galacticcouncil/sdk';
import {
  type Extrinsic,
  getAssetDecimals,
  getAssets,
  InvalidCurrencyError,
} from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import BigNumber from 'bignumber.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SmallAmountError } from '../../errors/SmallAmountError';
import type { TGetAmountOutOptions, TSwapOptions } from '../../types';
import HydrationExchangeNode from './HydrationDex';
import * as utils from './utils';

vi.mock('@galacticcouncil/sdk', () => ({
  PoolService: vi.fn(),
  TradeRouter: vi.fn().mockImplementation(() => ({
    getAllAssets: vi.fn(),
    getBestSell: vi.fn(),
    getBestSpotPrice: vi.fn(),
  })),
  PoolType: {
    XYK: 'xyk',
  },
}));

vi.mock('@paraspell/sdk-pjs', () => ({
  getAssetDecimals: vi.fn(),
  InvalidCurrencyError: class extends Error {},
  getNativeAssetSymbol: vi.fn(),
  getAssets: vi.fn(),
}));

vi.mock('./utils', () => ({
  getAssetInfo: vi.fn(),
  getMinAmountOut: vi.fn(),
  calculateFee: vi.fn(),
}));

describe('HydrationExchangeNode', () => {
  const api = {} as ApiPromise;
  let node: HydrationExchangeNode;

  beforeEach(() => {
    vi.clearAllMocks();

    node = new HydrationExchangeNode('Hydration', 'HydrationDex');
  });

  describe('swapCurrency', () => {
    it('throws if currencyFrom does not exist', async () => {
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce(undefined);
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 12, id: '2' } as Asset);

      const options = {
        assetFrom: { symbol: 'NON_EXISTENT' },
        assetTo: { symbol: 'XYZ' },
        slippagePct: '1',
        amount: '100',
      } as TSwapOptions;
      const toDestTransactionFee = BigNumber('10');

      await expect(node.swapCurrency(api, options, toDestTransactionFee)).rejects.toThrow(
        InvalidCurrencyError,
      );
    });

    it('throws if currencyTo does not exist', async () => {
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 12, id: '1' } as Asset);
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce(undefined);

      const options = {
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'NON_EXISTENT' },
        slippagePct: '1',
        amount: '100',
      } as TSwapOptions;

      const toDestTransactionFee = BigNumber('10');

      await expect(node.swapCurrency(api, options, toDestTransactionFee)).rejects.toThrow(
        InvalidCurrencyError,
      );
    });

    it('throws if either currencyFromDecimals or currencyToDecimals is falsy', async () => {
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 0, id: '1' } as Asset);
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 12, id: '2' } as Asset);

      const options = {
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'XYZ' },
        slippagePct: '1',
        amount: '100',
      } as TSwapOptions;

      const toDestTransactionFee = BigNumber('10');

      await expect(node.swapCurrency(api, options, toDestTransactionFee)).rejects.toThrow(
        InvalidCurrencyError,
      );
    });

    it('returns a fixed price when swapping to the native currency', async () => {
      vi.spyOn(utils, 'getAssetInfo')
        .mockResolvedValueOnce({ decimals: 12, id: '1', symbol: 'ABC' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: '999', symbol: 'HDX' } as Asset) // Native currency
        .mockResolvedValueOnce({ decimals: 12, id: '999', symbol: 'HDX' } as Asset); // Native currency info

      vi.mocked(utils.calculateFee).mockResolvedValueOnce(BigNumber('10'));
      vi.spyOn(utils, 'getMinAmountOut').mockReturnValue({ amount: BigNumber('90'), decimals: 12 });

      const mockToTxGet = vi.fn().mockResolvedValue('mockExtrinsic' as unknown as Extrinsic);

      vi.mocked(TradeRouter).mockImplementation(
        () =>
          ({
            getBestSell: vi.fn().mockResolvedValue({
              amountOut: new BigNumber('10000000000000000'),
              toTx: vi.fn().mockImplementation((_minAmount) => ({
                get: mockToTxGet,
              })),
            }),
            getBestSpotPrice: vi
              .fn()
              .mockResolvedValue({ amount: new BigNumber('1'), decimals: 12 }),
          }) as unknown as TradeRouter,
      );

      vi.mocked(getAssetDecimals).mockReturnValue(12);

      const options = {
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'HDX' },
        slippagePct: '1',
        amount: '10000',
      } as TSwapOptions;
      const toDestTransactionFee = new BigNumber('10');

      const result = await node.swapCurrency(api, options, toDestTransactionFee);

      expect(result.tx).toBe('mockExtrinsic');
      expect(result.amountOut).toBe('9999999999999989'); // Ensuring the fixed price is set correctly
    });

    it('throws if the amountWithoutFee becomes negative', async () => {
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 12, id: '1' } as Asset);
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 12, id: '2' } as Asset);

      vi.mocked(utils.calculateFee).mockResolvedValueOnce(BigNumber('150'));

      const options = {
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'XYZ' },
        slippagePct: '1',
        amount: '100',
      } as TSwapOptions;

      const toDestTransactionFee = BigNumber('10');

      await expect(node.swapCurrency(api, options, toDestTransactionFee)).rejects.toThrow(
        SmallAmountError,
      );
    });

    it('calls tradeRouter.getBestSell with correct arguments and returns correct tx / amountOut', async () => {
      vi.spyOn(utils, 'getAssetInfo')
        .mockResolvedValueOnce({ decimals: 12, id: '1', symbol: 'ABC' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: '2', symbol: 'XYZ' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: '999', symbol: 'HDX' } as Asset);

      vi.mocked(utils.calculateFee).mockResolvedValueOnce(BigNumber('10'));
      vi.spyOn(utils, 'getMinAmountOut').mockReturnValue({ amount: BigNumber('80'), decimals: 12 });

      const mockToTxGet = vi.fn().mockResolvedValue('mockExtrinsic' as unknown as Extrinsic);
      const mockTrade = {
        amountOut: new BigNumber('10000000000000000'),
        toTx: vi.fn().mockReturnValue({ get: mockToTxGet }),
      };

      vi.mocked(TradeRouter).mockImplementation(
        () =>
          ({
            getBestSell: vi.fn().mockResolvedValue(mockTrade),
            getBestSpotPrice: vi
              .fn()
              .mockResolvedValue({ amount: new BigNumber('1'), decimals: 12 }),
          }) as unknown as TradeRouter,
      );

      vi.mocked(getAssetDecimals).mockReturnValue(12);

      const options = {
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'XYZ' },
        slippagePct: '1',
        amount: '10000',
      } as TSwapOptions;
      const toDestTransactionFee = new BigNumber('10');

      const result = await node.swapCurrency(api, options, toDestTransactionFee);

      expect(result.tx).toBe('mockExtrinsic');
      expect(typeof result.amountOut).toBe('string');

      expect(mockTrade.toTx).toHaveBeenCalledWith(new BigNumber('80'));
      expect(mockToTxGet).toHaveBeenCalled();
    });

    it('throws SmallAmountError if final amountOut is negative after fees', async () => {
      vi.spyOn(utils, 'getAssetInfo')
        .mockResolvedValueOnce({ decimals: 12, id: '1', symbol: 'ABC' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: '2', symbol: 'XYZ' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: '999', symbol: 'HDX' } as Asset);

      vi.mocked(utils.calculateFee).mockResolvedValueOnce(BigNumber('10'));
      vi.spyOn(utils, 'getMinAmountOut').mockReturnValue({ amount: BigNumber('80'), decimals: 12 });

      const mockToTxGet = vi.fn().mockResolvedValue('mockExtrinsic' as unknown as Extrinsic);
      const mockTrade = {
        amountOut: new BigNumber('5'),
        toTx: vi.fn().mockReturnValue({ get: mockToTxGet }),
      };
      vi.mocked(TradeRouter).mockImplementation(
        () =>
          ({
            getBestSell: vi.fn().mockResolvedValue(mockTrade),
            getBestSpotPrice: vi
              .fn()
              .mockResolvedValue({ amount: new BigNumber('1'), decimals: 12 }),
          }) as unknown as TradeRouter,
      );

      vi.mocked(getAssetDecimals).mockReturnValue(12);

      const options = {
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'XYZ' },
        slippagePct: '1',
        amount: '100',
      } as TSwapOptions;

      const toDestTransactionFee = BigNumber('99999');

      await expect(node.swapCurrency(api, options, toDestTransactionFee)).rejects.toThrow(
        SmallAmountError,
      );
    });
  });

  describe('getAssets', () => {
    it('returns a list of assets in the correct format', async () => {
      const mockAssets = [
        { symbol: 'ABC', assetId: '1' },
        { symbol: 'XYZ', assetId: '2' },
      ];
      vi.mocked(TradeRouter).mockImplementation(
        () =>
          ({
            getAllAssets: vi.fn().mockResolvedValue(mockAssets),
          }) as unknown as TradeRouter,
      );

      vi.mocked(getAssets).mockReturnValue(mockAssets);

      const assets = await node.getAssets(api);

      expect(assets).toEqual(mockAssets);
    });
  });

  describe('getAmountOut', () => {
    it('returns the correct amountOut', async () => {
      const mockTradeRouter = {
        getBestSell: vi.fn().mockResolvedValue({ amountOut: new BigNumber('100') }),
      };
      vi.mocked(TradeRouter).mockImplementation(() => mockTradeRouter as unknown as TradeRouter);

      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 12, id: '1' } as Asset);
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 12, id: '2' } as Asset);

      const options = {
        assetFrom: { symbol: 'DOT' },
        assetTo: { symbol: 'HDX' },
        amount: '100',
        origin: {},
      } as TGetAmountOutOptions;

      const amountOut = await node.getAmountOut(api, options);

      expect(amountOut).toBe(100n);
    });
  });
});
