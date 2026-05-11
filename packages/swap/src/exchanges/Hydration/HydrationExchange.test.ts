import type { Asset, SdkCtx } from '@galacticcouncil/sdk-next';
import { createSdkContext } from '@galacticcouncil/sdk-next';
import type { AssetClient } from '@galacticcouncil/sdk-next/client';
import type { Trade, TradeRouter } from '@galacticcouncil/sdk-next/sor';
import type { TxBuilderFactory } from '@galacticcouncil/sdk-next/tx';
import type { TAssetInfo } from '@paraspell/sdk-core';
import {
  AmountTooLowError,
  findNativeAssetInfoOrThrow,
  getAssets,
  getNativeAssetSymbol,
  InvalidCurrencyError,
  UnableToComputeError,
} from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TPapiGetAmountOutOptions, TPapiSwapOptions } from '../../types';
import HydrationExchange from './HydrationExchange';
import * as utils from './utils';

vi.mock('@galacticcouncil/sdk-next', () => ({
  createSdkContext: vi.fn(),
}));

vi.mock('@paraspell/sdk-core', async (importOriginal) => ({
  ...(await importOriginal()),
  findNativeAssetInfoOrThrow: vi.fn(),
  getAssets: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
}));

vi.mock('./utils');

describe('HydrationExchange', () => {
  const apiPapi = {} as TPapiSwapOptions<unknown, unknown, unknown>['apiPapi'];
  let chain: HydrationExchange;
  let mockTxBuilderFactory: TxBuilderFactory;
  let mockTradeRouter: TradeRouter;
  let mockAssetClient: AssetClient;

  beforeEach(() => {
    vi.clearAllMocks();

    chain = new HydrationExchange('Hydration');

    const mockGet = vi.fn().mockReturnValue('mockExtrinsic');
    const mockBuild = vi.fn().mockResolvedValue({ get: mockGet });
    const mockWithBeneficiary = vi.fn().mockReturnValue({ build: mockBuild });
    const mockWithSlippage = vi.fn().mockReturnValue({ withBeneficiary: mockWithBeneficiary });
    const mockTrade = vi.fn().mockReturnValue({ withSlippage: mockWithSlippage });

    mockTxBuilderFactory = {
      trade: mockTrade,
    } as unknown as TxBuilderFactory;

    mockTradeRouter = {
      getBestSell: vi.fn(),
      getSpotPrice: vi.fn(),
    } as unknown as TradeRouter;

    mockAssetClient = {
      getSupported: vi.fn(),
    } as unknown as AssetClient;

    vi.mocked(createSdkContext).mockResolvedValue({
      api: { router: mockTradeRouter },
      client: { asset: mockAssetClient },
      tx: mockTxBuilderFactory,
      destroy: vi.fn(),
    } as unknown as SdkCtx);

    vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX');
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
      symbol: 'HDX',
      decimals: 12,
    } as TAssetInfo);
  });

  describe('swapCurrency', () => {
    it('throws UnableToComputeError if priceInfo is not found (and currencyTo is not native)', async () => {
      vi.spyOn(utils, 'getAssetInfo')
        .mockResolvedValueOnce({ decimals: 12, id: 1, symbol: 'ABC' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: 2, symbol: 'XYZ' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: 999, symbol: 'HDX' } as Asset);

      vi.mocked(utils.calculateFee).mockResolvedValueOnce(10n);

      const mockTrade = {
        amountOut: 10000000000000000n,
      } as unknown as Trade;

      vi.spyOn(mockTradeRouter, 'getBestSell').mockResolvedValue(mockTrade);
      const spotPriceSpy = vi
        .spyOn(mockTradeRouter, 'getSpotPrice')
        .mockImplementation((assetIdA: number, assetIdB: number) => {
          if (assetIdA === 2 && assetIdB === 999) {
            return Promise.resolve(undefined);
          }
          return Promise.resolve({ amount: 1000000000000n, decimals: 12 });
        });

      const options = {
        origin: { chain: 'Acala' },
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'XYZ' },
        slippagePct: '1',
        amount: 10000n,
        apiPapi,
      } as TPapiSwapOptions<unknown, unknown, unknown>;
      const toDestTransactionFee = 10n;

      await expect(chain.swapCurrency(options, toDestTransactionFee)).rejects.toThrow(
        UnableToComputeError,
      );

      expect(spotPriceSpy).toHaveBeenCalledWith(2, 999);
    });

    it('throws if currencyFrom does not exist', async () => {
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce(undefined);
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 12, id: 2 } as Asset);

      const options = {
        assetFrom: { symbol: 'NON_EXISTENT' },
        assetTo: { symbol: 'XYZ' },
        slippagePct: '1',
        amount: 100n,
        apiPapi,
      } as TPapiSwapOptions<unknown, unknown, unknown>;
      const toDestTransactionFee = 10n;

      await expect(chain.swapCurrency(options, toDestTransactionFee)).rejects.toThrow(
        InvalidCurrencyError,
      );
    });

    it('throws if currencyTo does not exist', async () => {
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 12, id: 1 } as Asset);
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce(undefined);

      const options = {
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'NON_EXISTENT' },
        slippagePct: '1',
        amount: 100n,
        apiPapi,
      } as TPapiSwapOptions<unknown, unknown, unknown>;

      const toDestTransactionFee = 10n;

      await expect(chain.swapCurrency(options, toDestTransactionFee)).rejects.toThrow(
        InvalidCurrencyError,
      );
    });

    it('returns a fixed price when swapping to the native currency', async () => {
      vi.spyOn(utils, 'getAssetInfo')
        .mockResolvedValueOnce({ decimals: 12, id: 1, symbol: 'ABC' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: 999, symbol: 'HDX' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: 999, symbol: 'HDX' } as Asset);

      vi.mocked(utils.calculateFee).mockResolvedValueOnce(10n);

      vi.spyOn(mockTradeRouter, 'getBestSell').mockResolvedValue({
        amountOut: 10000000000000000n,
      } as unknown as Trade);
      vi.spyOn(mockTradeRouter, 'getSpotPrice').mockResolvedValue({
        amount: 1000000000000n,
        decimals: 12,
      });

      const options = {
        origin: {
          chain: 'Acala',
        },
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'HDX' },
        slippagePct: '1',
        amount: 10000n,
        apiPapi,
      } as TPapiSwapOptions<unknown, unknown, unknown>;
      const toDestTransactionFee = 10n;

      const result = await chain.swapCurrency(options, toDestTransactionFee);

      expect(result.tx).toBe('mockExtrinsic');
      expect(result.amountOut).toBe(9999999999999999n);
    });

    it('throws if the amountWithoutFee becomes negative', async () => {
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 12, id: 1 } as Asset);
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 12, id: 2 } as Asset);

      vi.mocked(utils.calculateFee).mockResolvedValueOnce(150n);

      const options = {
        origin: {
          chain: 'Acala',
        },
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'XYZ' },
        slippagePct: '1',
        amount: 100n,
        apiPapi,
      } as TPapiSwapOptions<unknown, unknown, unknown>;

      const toDestTransactionFee = 10n;

      await expect(chain.swapCurrency(options, toDestTransactionFee)).rejects.toThrow(
        AmountTooLowError,
      );
    });

    it('calls tradeRouter.getBestSell with correct arguments and returns correct tx / amountOut', async () => {
      vi.spyOn(utils, 'getAssetInfo')
        .mockResolvedValueOnce({ decimals: 12, id: 1, symbol: 'ABC' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: 2, symbol: 'XYZ' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: 999, symbol: 'HDX' } as Asset);

      vi.mocked(utils.calculateFee).mockResolvedValueOnce(10n);

      const mockTrade = {
        amountOut: 10000000000000000n,
      } as unknown as Trade;

      vi.spyOn(mockTradeRouter, 'getBestSell').mockResolvedValue(mockTrade);
      vi.spyOn(mockTradeRouter, 'getSpotPrice').mockResolvedValue({
        amount: 1000000000000n,
        decimals: 12,
      });

      const options = {
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'XYZ' },
        slippagePct: '1',
        amount: 10000n,
        apiPapi,
      } as TPapiSwapOptions<unknown, unknown, unknown>;
      const toDestTransactionFee = 10n;

      const tradeSpy = vi.spyOn(mockTxBuilderFactory, 'trade');
      const slippageSpy = vi.spyOn(mockTxBuilderFactory.trade(mockTrade), 'withSlippage');

      const result = await chain.swapCurrency(options, toDestTransactionFee);

      expect(result.tx).toBe('mockExtrinsic');
      expect(typeof result.amountOut).toBe('bigint');

      expect(tradeSpy).toHaveBeenCalledWith(mockTrade);
      expect(slippageSpy).toHaveBeenCalledWith(1);
    });

    it('throws AmountTooLowError if final amountOut is negative after fees', async () => {
      vi.spyOn(utils, 'getAssetInfo')
        .mockResolvedValueOnce({ decimals: 12, id: 1, symbol: 'ABC' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: 2, symbol: 'XYZ' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: 999, symbol: 'HDX' } as Asset);

      vi.mocked(utils.calculateFee).mockResolvedValueOnce(10n);

      const mockTrade = {
        amountOut: 5n,
      } as unknown as Trade;

      vi.spyOn(mockTradeRouter, 'getBestSell').mockResolvedValue(mockTrade);
      vi.spyOn(mockTradeRouter, 'getSpotPrice').mockResolvedValue({
        amount: 1000000000000n,
        decimals: 12,
      });

      const options = {
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'XYZ' },
        slippagePct: '1',
        amount: 100n,
        apiPapi,
      } as TPapiSwapOptions<unknown, unknown, unknown>;

      const toDestTransactionFee = 99999n;

      await expect(chain.swapCurrency(options, toDestTransactionFee)).rejects.toThrow(
        AmountTooLowError,
      );
    });
  });

  describe('getDexConfig', () => {
    it('returns dex config', async () => {
      const mockAssets = [
        { symbol: 'ABC', id: 1 },
        { symbol: 'XYZ', id: 2 },
      ] as Asset[];

      vi.spyOn(mockAssetClient, 'getSupported').mockResolvedValue(mockAssets);

      vi.mocked(getAssets).mockReturnValue([
        { symbol: 'ABC', decimals: 12, assetId: '1', location: { parents: 0, interior: 'Here' } },
        { symbol: 'XYZ', decimals: 12, assetId: '2', location: { parents: 1, interior: 'Here' } },
      ]);

      const result = await chain.getDexConfig(apiPapi);

      expect(result).toEqual({
        isOmni: true,
        assets: [
          {
            parents: 0,
            interior: 'Here',
          },
          {
            parents: 1,
            interior: 'Here',
          },
        ],
        pairs: [],
      });
    });
  });

  describe('getAmountOut', () => {
    it('returns the correct amountOut', async () => {
      vi.spyOn(mockTradeRouter, 'getBestSell').mockResolvedValue({
        amountOut: 100n,
      } as unknown as Trade);

      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 12, id: 1 } as Asset);
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 12, id: 2 } as Asset);

      const options = {
        assetFrom: { symbol: 'DOT' },
        assetTo: { symbol: 'HDX' },
        amount: 100n,
        origin: {},
        apiPapi,
      } as TPapiGetAmountOutOptions<unknown, unknown, unknown>;

      const amountOut = await chain.getAmountOut(options);

      expect(amountOut).toBe(100n);
    });
  });
});
