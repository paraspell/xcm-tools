import type { Asset, SdkCtx } from '@galacticcouncil/sdk-next';
import { createSdkContext } from '@galacticcouncil/sdk-next';
import type { AssetClient } from '@galacticcouncil/sdk-next/client';
import type { Trade, TradeRouter } from '@galacticcouncil/sdk-next/sor';
import type { TxBuilderFactory } from '@galacticcouncil/sdk-next/tx';
import type { TAssetInfo } from '@paraspell/sdk-core';
import {
  AmountTooLowError,
  findNativeAssetInfoOrThrow,
  formatUnits,
  getAssets,
  getNativeAssetSymbol,
  InvalidCurrencyError,
  padValueBy,
  UnableToComputeError,
} from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEST_FEE_BUFFER_PCT } from '../../consts';
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
  let mockDestroy: ReturnType<typeof vi.fn>;

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
      getPools: vi.fn(),
      getSpotPrice: vi.fn(),
    } as unknown as TradeRouter;

    mockAssetClient = {
      getSupported: vi.fn(),
    } as unknown as AssetClient;

    mockDestroy = vi.fn();

    vi.mocked(createSdkContext).mockResolvedValue({
      api: { router: mockTradeRouter },
      client: { asset: mockAssetClient },
      tx: mockTxBuilderFactory,
      destroy: mockDestroy,
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
      expect(mockDestroy).toHaveBeenCalledTimes(1);
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
      expect(result.amountOut).toBe(9999999999999989n);
    });

    it('throws AmountTooLowError when the origin reserve consumes the whole input', async () => {
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 12, id: 1 } as Asset);
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValueOnce({ decimals: 12, id: 2 } as Asset);

      const amount = 1n;
      expect(padValueBy(amount, DEST_FEE_BUFFER_PCT)).toBe(0n);

      const options = {
        origin: {
          chain: 'Acala',
        },
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'XYZ' },
        slippagePct: '1',
        amount,
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
      expect(mockDestroy).toHaveBeenCalledTimes(1);
    });

    it('throws AmountTooLowError if final amountOut is negative after fees', async () => {
      vi.spyOn(utils, 'getAssetInfo')
        .mockResolvedValueOnce({ decimals: 12, id: 1, symbol: 'ABC' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: 2, symbol: 'XYZ' } as Asset)
        .mockResolvedValueOnce({ decimals: 12, id: 999, symbol: 'HDX' } as Asset);

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
        { symbol: 'UNPOOLED', id: 3 },
      ] as Asset[];

      vi.spyOn(mockAssetClient, 'getSupported').mockResolvedValue(mockAssets);
      vi.spyOn(mockTradeRouter, 'getPools').mockResolvedValue([
        { tokens: [{ id: 1 }, { id: 2 }] },
      ] as never);

      vi.mocked(getAssets).mockReturnValue([
        {
          symbol: 'ABC',
          decimals: 12,
          existentialDeposit: '1000',
          assetId: '1',
          location: { parents: 0, interior: 'Here' },
        },
        {
          symbol: 'XYZ',
          decimals: 12,
          existentialDeposit: '1000',
          assetId: '2',
          location: { parents: 1, interior: 'Here' },
        },
        {
          symbol: 'UNPOOLED',
          decimals: 12,
          existentialDeposit: '1000',
          assetId: '3',
          location: { parents: 1, interior: { X1: [{ Parachain: 1000 }] } },
        },
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
      expect(mockDestroy).toHaveBeenCalledTimes(1);
    });

    it('destroys the sdk context when the asset lookup fails', async () => {
      vi.spyOn(utils, 'getAssetInfo').mockResolvedValue(undefined);

      const options = {
        assetFrom: { symbol: 'DOT' },
        assetTo: { symbol: 'HDX' },
        amount: 100n,
        origin: {},
        apiPapi,
      } as TPapiGetAmountOutOptions<unknown, unknown, unknown>;

      await expect(chain.getAmountOut(options)).rejects.toThrow(InvalidCurrencyError);
      expect(mockDestroy).toHaveBeenCalledTimes(1);
    });
  });

  describe('amountWithoutFee input model', () => {
    const amount = 1000n;
    const currencyFrom = { decimals: 0, id: 1, symbol: 'ABC' } as Asset;
    const currencyTo = { decimals: 0, id: 2, symbol: 'XYZ' } as Asset;
    const nativeCurrency = { decimals: 12, id: 999, symbol: 'HDX' } as Asset;

    const quoteAndExecute = async (origin?: { chain: 'Acala' }) => {
      vi.spyOn(utils, 'getAssetInfo')
        .mockResolvedValueOnce(currencyFrom)
        .mockResolvedValueOnce(currencyTo)
        .mockResolvedValueOnce(nativeCurrency)
        .mockResolvedValueOnce(currencyFrom)
        .mockResolvedValueOnce(currencyTo);

      // A computed fee other than 1% must not change the amount either side trades.
      vi.mocked(utils.calculateFee).mockResolvedValue(50n);

      vi.spyOn(mockTradeRouter, 'getSpotPrice').mockResolvedValue({
        amount: 1000000000000n,
        decimals: 12,
      });

      const getBestSell = vi
        .spyOn(mockTradeRouter, 'getBestSell')
        .mockImplementation((_from: number, _to: number, amountIn: string | bigint) =>
          Promise.resolve({ amountOut: BigInt(amountIn) * 2n } as unknown as Trade),
        );

      const options = {
        ...(origin ? { origin } : {}),
        assetFrom: { symbol: 'ABC' },
        assetTo: { symbol: 'XYZ' },
        slippagePct: '0',
        amount,
        sender: 'sender',
        feeCalcAddress: 'fee-address',
        apiPapi,
      };

      const execution = await chain.swapCurrency(
        options as TPapiSwapOptions<unknown, unknown, unknown>,
        0n,
      );
      const quote = await chain.getAmountOut(
        options as unknown as TPapiGetAmountOutOptions<unknown, unknown, unknown>,
      );

      return { execution, quote, getBestSell };
    };

    it('prices the trade on the same reserved input when origin is provided', async () => {
      const { execution, quote, getBestSell } = await quoteAndExecute({ chain: 'Acala' });
      const expectedInput = formatUnits(padValueBy(amount, DEST_FEE_BUFFER_PCT), 0);

      expect(expectedInput).toBe('990');
      expect(getBestSell).toHaveBeenNthCalledWith(1, 1, 2, expectedInput);
      expect(getBestSell).toHaveBeenNthCalledWith(2, 1, 2, expectedInput);
      expect(quote).toBe(execution.amountOut);
      expect(quote).toBe(1980n);
      expect(utils.calculateFee).not.toHaveBeenCalled();
    });

    it('prices the trade on the full amount when origin is omitted', async () => {
      const { execution, quote, getBestSell } = await quoteAndExecute();
      const expectedInput = formatUnits(amount, 0);

      expect(expectedInput).toBe('1000');
      expect(getBestSell).toHaveBeenNthCalledWith(1, 1, 2, expectedInput);
      expect(getBestSell).toHaveBeenNthCalledWith(2, 1, 2, expectedInput);
      expect(quote).toBe(execution.amountOut);
      expect(quote).toBe(2000n);
      expect(utils.calculateFee).not.toHaveBeenCalled();
    });
  });
});
