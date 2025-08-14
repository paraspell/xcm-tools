import type { Asset, SdkCtx, Trade, TradeRouter, TxBuilderFactory } from '@galacticcouncil/sdk';
import { createSdkContext } from '@galacticcouncil/sdk';
import {
  getAssetDecimals,
  getAssets,
  getNativeAssetSymbol,
  InvalidCurrencyError,
  InvalidParameterError,
} from '@paraspell/sdk';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import BigNumber from 'bignumber.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SmallAmountError } from '../../errors/SmallAmountError';
import type { TGetAmountOutOptions, TSwapOptions } from '../../types';
import HydrationExchange from './HydrationExchange';
import * as utils from './utils';

vi.mock('@galacticcouncil/sdk', () => ({
  createSdkContext: vi.fn(),
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

vi.mock('@paraspell/sdk', () => ({
  getAssetDecimals: vi.fn(),
  InvalidCurrencyError: class extends Error {},
  InvalidParameterError: class extends Error {},
  getNativeAssetSymbol: vi.fn(),
  getAssets: vi.fn(),
  isForeignAsset: vi.fn().mockReturnValue(true),
}));

vi.mock('./utils', () => ({
  getAssetInfo: vi.fn(),
  getMinAmountOut: vi.fn(),
  calculateFee: vi.fn(),
}));

describe('HydrationExchange', () => {
  const api = {} as ApiPromise;
  let chain: HydrationExchange;
  let mockTxBuilderFactory: TxBuilderFactory;
  let mockTradeRouter: TradeRouter;

  beforeEach(() => {
    vi.clearAllMocks();

    chain = new HydrationExchange('Hydration', 'HydrationDex');

    const mockGet = vi.fn().mockReturnValue('mockExtrinsic' as unknown as Extrinsic);
    const mockBuild = vi.fn().mockResolvedValue({ get: mockGet });
    const mockWithBeneficiary = vi.fn().mockReturnValue({ build: mockBuild });
    const mockWithSlippage = vi.fn().mockReturnValue({ withBeneficiary: mockWithBeneficiary });
    const mockTrade = vi.fn().mockReturnValue({ withSlippage: mockWithSlippage });

    mockTxBuilderFactory = {
      trade: mockTrade,
    } as unknown as TxBuilderFactory;

    mockTradeRouter = {
      getAllAssets: vi.fn(),
      getBestSell: vi.fn(),
      getBestSpotPrice: vi.fn(),
    } as unknown as TradeRouter;

    vi.mocked(createSdkContext).mockReturnValue({
      api: { router: mockTradeRouter },
      tx: mockTxBuilderFactory,
    } as SdkCtx);
  });

  describe('swapCurrency', () => {
    it('throws InvalidParameterError if native currency decimals are not found', async () => {
      vi.spyOn(utils, 'getAssetInfo')
        .mockResolvedValueOnce({ decimals: 12, id: '1', symbol: 'ABC' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: '2', symbol: 'XYZ' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: '999', symbol: 'HDX' } as Asset);

      vi.mocked(utils.calculateFee).mockResolvedValueOnce(BigNumber('10'));

      const mockTrade = {
        amountOut: new BigNumber('10000000000000000'),
      } as unknown as Trade;

      vi.spyOn(mockTradeRouter, 'getBestSell').mockResolvedValue(mockTrade);
      vi.spyOn(mockTradeRouter, 'getBestSpotPrice').mockResolvedValue({
        amount: new BigNumber('1'),
        decimals: 12,
      });

      vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX');

      vi.mocked(getAssetDecimals).mockImplementation((_chain, symbol) => {
        if (symbol === 'HDX') {
          return null;
        }
        return 12;
      });

      const options = {
        origin: { chain: 'Acala' },
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'XYZ' },
        slippagePct: '1',
        amount: '10000',
      } as TSwapOptions;
      const toDestTransactionFee = BigNumber('10');

      await expect(chain.swapCurrency(api, options, toDestTransactionFee)).rejects.toThrow(
        new InvalidParameterError('Native currency decimals not found'),
      );

      expect(getAssetDecimals).toHaveBeenCalledWith(chain.chain, 'HDX');
    });

    it('throws InvalidParameterError if priceInfo is not found (and currencyTo is not native)', async () => {
      vi.spyOn(utils, 'getAssetInfo')
        .mockResolvedValueOnce({ decimals: 12, id: '1', symbol: 'ABC' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: '2', symbol: 'XYZ' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: '999', symbol: 'HDX' } as Asset);

      vi.mocked(utils.calculateFee).mockResolvedValueOnce(BigNumber('10'));

      const mockTrade = {
        amountOut: new BigNumber('10000000000000000'),
      } as unknown as Trade;

      vi.spyOn(mockTradeRouter, 'getBestSell').mockResolvedValue(mockTrade);
      const spotPriceSpy = vi
        .spyOn(mockTradeRouter, 'getBestSpotPrice')
        .mockImplementation((assetIdA, assetIdB) => {
          if (assetIdA === '2' && assetIdB === '999') {
            return Promise.resolve(undefined);
          }
          return Promise.resolve({ amount: new BigNumber('1'), decimals: 12 });
        });

      vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX');
      vi.mocked(getAssetDecimals).mockReturnValue(12);

      const options = {
        origin: { chain: 'Acala' },
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'XYZ' },
        slippagePct: '1',
        amount: '10000',
      } as TSwapOptions;
      const toDestTransactionFee = BigNumber('10');

      await expect(chain.swapCurrency(api, options, toDestTransactionFee)).rejects.toThrow(
        new InvalidParameterError('Price not found'),
      );

      expect(spotPriceSpy).toHaveBeenCalledWith('2', '999');
    });

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

      await expect(chain.swapCurrency(api, options, toDestTransactionFee)).rejects.toThrow(
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

      await expect(chain.swapCurrency(api, options, toDestTransactionFee)).rejects.toThrow(
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

      await expect(chain.swapCurrency(api, options, toDestTransactionFee)).rejects.toThrow(
        InvalidCurrencyError,
      );
    });

    it('returns a fixed price when swapping to the native currency', async () => {
      vi.spyOn(utils, 'getAssetInfo')
        .mockResolvedValueOnce({ decimals: 12, id: '1', symbol: 'ABC' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: '999', symbol: 'HDX' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: '999', symbol: 'HDX' } as Asset);

      vi.mocked(utils.calculateFee).mockResolvedValueOnce(BigNumber('10'));

      vi.spyOn(mockTradeRouter, 'getBestSell').mockResolvedValue({
        amountOut: new BigNumber('10000000000000000'),
      } as unknown as Trade);
      vi.spyOn(mockTradeRouter, 'getBestSpotPrice').mockResolvedValue({
        amount: new BigNumber('1'),
        decimals: 12,
      });

      vi.mocked(getAssetDecimals).mockReturnValue(12);
      vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX');

      const options = {
        origin: {
          chain: 'Acala',
        },
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'HDX' },
        slippagePct: '1',
        amount: '10000',
      } as TSwapOptions;
      const toDestTransactionFee = new BigNumber('10');

      const result = await chain.swapCurrency(api, options, toDestTransactionFee);

      expect(result.tx).toBe('mockExtrinsic');
      expect(result.amountOut).toBe('9999999999999989');
    });

    it('throws if the amountWithoutFee becomes negative', async () => {
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 12, id: '1' } as Asset);
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 12, id: '2' } as Asset);

      vi.mocked(utils.calculateFee).mockResolvedValueOnce(BigNumber('150'));

      const options = {
        origin: {
          chain: 'Acala',
        },
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'XYZ' },
        slippagePct: '1',
        amount: '100',
      } as TSwapOptions;

      const toDestTransactionFee = BigNumber('10');

      await expect(chain.swapCurrency(api, options, toDestTransactionFee)).rejects.toThrow(
        SmallAmountError,
      );
    });

    it('calls tradeRouter.getBestSell with correct arguments and returns correct tx / amountOut', async () => {
      vi.spyOn(utils, 'getAssetInfo')
        .mockResolvedValueOnce({ decimals: 12, id: '1', symbol: 'ABC' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: '2', symbol: 'XYZ' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: '999', symbol: 'HDX' } as Asset);

      vi.mocked(utils.calculateFee).mockResolvedValueOnce(BigNumber('10'));

      const mockTrade = {
        amountOut: new BigNumber('10000000000000000'),
      } as unknown as Trade;

      vi.spyOn(mockTradeRouter, 'getBestSell').mockResolvedValue(mockTrade);
      vi.spyOn(mockTradeRouter, 'getBestSpotPrice').mockResolvedValue({
        amount: new BigNumber('1'),
        decimals: 12,
      });

      vi.mocked(getAssetDecimals).mockReturnValue(12);

      const options = {
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'XYZ' },
        slippagePct: '1',
        amount: '10000',
      } as TSwapOptions;
      const toDestTransactionFee = new BigNumber('10');

      const tradeSpy = vi.spyOn(mockTxBuilderFactory, 'trade');
      const slippageSpy = vi.spyOn(mockTxBuilderFactory.trade(mockTrade), 'withSlippage');

      const result = await chain.swapCurrency(api, options, toDestTransactionFee);

      expect(result.tx).toBe('mockExtrinsic');
      expect(typeof result.amountOut).toBe('string');

      expect(tradeSpy).toHaveBeenCalledWith(mockTrade);
      expect(slippageSpy).toHaveBeenCalledWith(1);
    });

    it('throws SmallAmountError if final amountOut is negative after fees', async () => {
      vi.spyOn(utils, 'getAssetInfo')
        .mockResolvedValueOnce({ decimals: 12, id: '1', symbol: 'ABC' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: '2', symbol: 'XYZ' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: '999', symbol: 'HDX' } as Asset);

      vi.mocked(utils.calculateFee).mockResolvedValueOnce(BigNumber('10'));

      const mockTrade = {
        amountOut: new BigNumber('5'),
      } as unknown as Trade;

      vi.spyOn(mockTradeRouter, 'getBestSell').mockResolvedValue(mockTrade);
      vi.spyOn(mockTradeRouter, 'getBestSpotPrice').mockResolvedValue({
        amount: new BigNumber('1'),
        decimals: 12,
      });

      vi.mocked(getAssetDecimals).mockReturnValue(12);

      const options = {
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'XYZ' },
        slippagePct: '1',
        amount: '100',
      } as TSwapOptions;

      const toDestTransactionFee = BigNumber('99999');

      await expect(chain.swapCurrency(api, options, toDestTransactionFee)).rejects.toThrow(
        SmallAmountError,
      );
    });
  });

  describe('getDexConfig', () => {
    it('returns dex config', async () => {
      const mockAssets = [
        { symbol: 'ABC', id: '1' },
        { symbol: 'XYZ', id: '2' },
      ] as Asset[];

      vi.spyOn(mockTradeRouter, 'getAllAssets').mockResolvedValue(mockAssets);

      vi.mocked(getAssets).mockReturnValue([
        { symbol: 'ABC', decimals: 12, assetId: '1' },
        { symbol: 'XYZ', decimals: 12, assetId: '2' },
      ]);

      const result = await chain.getDexConfig(api);

      expect(result).toEqual({
        isOmni: true,
        assets: [
          { symbol: 'ABC', assetId: '1', location: undefined },
          { symbol: 'XYZ', assetId: '2', location: undefined },
        ],
        pairs: [],
      });
    });
  });

  describe('getAmountOut', () => {
    it('returns the correct amountOut', async () => {
      vi.spyOn(mockTradeRouter, 'getBestSell').mockResolvedValue({
        amountOut: new BigNumber('100'),
      } as unknown as Trade);

      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 12, id: '1' } as Asset);
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 12, id: '2' } as Asset);

      const options = {
        assetFrom: { symbol: 'DOT' },
        assetTo: { symbol: 'HDX' },
        amount: '100',
        origin: {},
      } as TGetAmountOutOptions;

      const amountOut = await chain.getAmountOut(api, options);

      expect(amountOut).toBe(100n);
    });
  });
});
