import type { PolkadotApi } from '@paraspell/sdk-core';
import {
  AmountTooLowError,
  getNativeAssetSymbol,
  Parents,
  RoutingResolutionError,
  type TLocation,
} from '@paraspell/sdk-core';
import type { ApiPromise } from '@polkadot/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExchangeAsset } from '../../assets';
import type { TSingleSwapResult, TSwapOptions } from '../../types';
import AssetHubExchange from './AssetHubExchange';

vi.mock('@paraspell/sdk-core', async (importOriginal) => ({
  ...(await importOriginal()),
  getNativeAssetSymbol: vi.fn(),
  localizeLocation: vi.fn((_chain: unknown, ml: TLocation) => ml),
}));

vi.mock('../../assets');

describe('AssetHubExchange', () => {
  let instance: AssetHubExchange;
  let api: ApiPromise;
  let mockPolkadotApi: {
    queryRuntimeApi: ReturnType<typeof vi.fn>;
    deserializeExtrinsics: ReturnType<typeof vi.fn>;
  };
  const dummyTx = { dummy: true };
  const assetFromML: TLocation = { parents: 0, interior: { X1: [{ PalletInstance: 1 }] } };
  const assetToML: TLocation = { parents: 0, interior: { X1: [{ GeneralIndex: 2 }] } };
  let baseSwapOptions: TSwapOptions<unknown, unknown, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    instance = new AssetHubExchange('AssetHubPolkadot');
    api = {} as unknown as ApiPromise;
    mockPolkadotApi = {
      queryRuntimeApi: vi.fn(),
      deserializeExtrinsics: vi.fn(() => dummyTx),
    };

    baseSwapOptions = {
      api: mockPolkadotApi as unknown as PolkadotApi<unknown, unknown, unknown>,
      apiPjs: api,
      assetFrom: { symbol: 'ASSET1', decimals: 10, isNative: true, location: assetFromML },
      assetTo: { symbol: 'ASSET2', decimals: 10, location: assetToML },
      amount: 1000n,
      sender: 'sender',
      slippagePct: '5',
      feeCalcAddress: 'sender',
      origin: undefined,
    };
  });

  describe('swapCurrency', () => {
    it('should throw AmountTooLowError if amount is too small', async () => {
      vi.mocked(mockPolkadotApi.queryRuntimeApi)
        .mockResolvedValueOnce(100n)
        .mockResolvedValueOnce(10000000n);
      const opts = {
        ...baseSwapOptions,
        assetFrom: { symbol: 'ASSET1', decimals: 10, location: assetFromML },
        assetTo: { symbol: 'NATIVE', decimals: 10, location: assetToML },
        amount: 1000n,
      } as TSwapOptions<unknown, unknown, unknown>;
      vi.mocked(getNativeAssetSymbol).mockReturnValue('NOT_NATIVE');
      await expect(instance.swapCurrency(opts, 50000n)).rejects.toThrow(AmountTooLowError);
    });

    it('should swap using native fee conversion when assetTo.symbol equals native asset symbol', async () => {
      const opts = {
        ...baseSwapOptions,
        assetTo: { symbol: 'NATIVE', location: assetToML },
        origin: {},
      } as TSwapOptions<unknown, unknown, unknown>;
      vi.mocked(mockPolkadotApi.queryRuntimeApi).mockResolvedValueOnce(2000n);
      vi.mocked(getNativeAssetSymbol).mockReturnValue('NATIVE');
      const toDestTxFee = 50n;
      const result: TSingleSwapResult<unknown> = await instance.swapCurrency(opts, toDestTxFee);
      expect(mockPolkadotApi.deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'AssetConversion',
        method: 'swap_exact_tokens_for_tokens',
        params: {
          path: [assetFromML, assetToML],
          amount_in: 990n,
          amount_out_min: 1900n,
          send_to: 'sender',
          keep_alive: true,
        },
      });
      expect(result).toEqual({ tx: dummyTx, amountOut: 1945n });
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenCalledTimes(1);
    });

    it('should swap using fee conversion via queryRuntimeApi when assetTo.symbol is not native', async () => {
      const opts = {
        ...baseSwapOptions,
        assetTo: { symbol: 'NON_NATIVE', location: assetToML },
        origin: undefined,
      } as TSwapOptions<unknown, unknown, unknown>;
      vi.mocked(mockPolkadotApi.queryRuntimeApi)
        .mockResolvedValueOnce(2000n)
        .mockResolvedValueOnce(100n);
      vi.mocked(getNativeAssetSymbol).mockReturnValue('NATIVE');
      const toDestTxFee = 50n;
      const result: TSingleSwapResult<unknown> = await instance.swapCurrency(opts, toDestTxFee);
      expect(mockPolkadotApi.deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'AssetConversion',
        method: 'swap_exact_tokens_for_tokens',
        params: {
          path: [assetFromML, assetToML],
          amount_in: 1000n,
          amount_out_min: 1900n,
          send_to: 'sender',
          keep_alive: true,
        },
      });
      expect(result).toEqual({ tx: dummyTx, amountOut: 1890n });
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenCalledTimes(2);

      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenNthCalledWith(2, {
        module: 'AssetConversionApi',
        method: 'quote_price_exact_tokens_for_tokens',
        params: [
          {
            parents: Parents.ONE,
            interior: { Here: null },
          },
          assetToML,
          toDestTxFee,
          true,
        ],
      });
    });

    it('should throw RoutingResolutionError if queryRuntimeApi returns undefined', async () => {
      vi.mocked(mockPolkadotApi.queryRuntimeApi).mockResolvedValueOnce(undefined);
      vi.mocked(getNativeAssetSymbol).mockReturnValue('NATIVE');
      await expect(instance.swapCurrency(baseSwapOptions, 0n)).rejects.toThrow(
        RoutingResolutionError,
      );
    });
  });

  describe('handleMultiSwap', () => {
    const assetNative = {
      symbol: 'NATIVE',
      decimals: 12,
      location: { parents: 0, interior: { Here: null } },
    };

    const assetA = {
      symbol: 'A',
      location: { parents: 0, interior: { X1: [{ PalletInstance: 1 }] } },
    };
    const assetB = {
      symbol: 'B',
      location: { parents: 0, interior: { X1: [{ GeneralIndex: 2 }] } },
    };

    const baseOpts = {
      api: {} as TSwapOptions<unknown, unknown, unknown>['api'],
      apiPjs: api,
      amount: 1000n,
      sender: 'sender',
      slippagePct: '5',
      feeCalcAddress: 'sender',
      origin: undefined,
    };

    beforeEach(() => {
      vi.mocked(getExchangeAsset).mockReturnValue(assetNative);
      baseOpts.api = mockPolkadotApi as unknown as PolkadotApi<unknown, unknown, unknown>;
    });

    it('throws when native asset not found', async () => {
      vi.mocked(getExchangeAsset).mockReturnValue(null);
      await expect(
        instance.handleMultiSwap(
          {
            ...baseOpts,
            assetFrom: assetA,
            assetTo: assetB,
          } as TSwapOptions<unknown, unknown, unknown>,
          0n,
        ),
      ).rejects.toThrow(RoutingResolutionError);
    });

    it('throws when swapping native asset to itself', async () => {
      await expect(
        instance.handleMultiSwap(
          {
            ...baseOpts,
            assetFrom: assetNative,
            assetTo: assetNative,
          },
          0n,
        ),
      ).rejects.toThrow(RoutingResolutionError);
    });

    it('handles single hop when assetFrom is native', async () => {
      instance.swapCurrency = vi.fn().mockResolvedValueOnce({
        tx: dummyTx,
        amountOut: 999n,
      });

      const spy = vi.spyOn(instance, 'swapCurrency');

      const result = await instance.handleMultiSwap(
        {
          ...baseOpts,
          assetFrom: assetNative,
          assetTo: assetB,
        } as TSwapOptions<unknown, unknown, unknown>,
        0n,
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ txs: [dummyTx], amountOut: 999n });
    });

    it('handles single hop when assetTo is native', async () => {
      instance.swapCurrency = vi.fn().mockResolvedValueOnce({
        tx: dummyTx,
        amountOut: 888n,
      });

      const spy = vi.spyOn(instance, 'swapCurrency');

      const result = await instance.handleMultiSwap(
        {
          ...baseOpts,
          assetFrom: assetA,
          assetTo: assetNative,
        } as TSwapOptions<unknown, unknown, unknown>,
        0n,
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ txs: [dummyTx], amountOut: 888n });
    });

    it('handles multi-hop swap when both assets are non-native', async () => {
      instance.swapCurrency = vi
        .fn()
        .mockResolvedValueOnce({ tx: 'tx1', amountOut: 1000n })
        .mockResolvedValueOnce({ tx: 'tx2', amountOut: 950n });

      const spy = vi.spyOn(instance, 'swapCurrency');

      const result = await instance.handleMultiSwap(
        {
          ...baseOpts,
          assetFrom: assetA,
          assetTo: assetB,
        } as TSwapOptions<unknown, unknown, unknown>,
        0n,
      );

      expect(spy).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        txs: ['tx1', 'tx2'],
        amountOut: 950n,
      });
    });

    it('throws if hop 1 returns 0', async () => {
      instance.swapCurrency = vi.fn().mockResolvedValueOnce({ tx: 'tx1', amountOut: 0n });
      await expect(
        instance.handleMultiSwap(
          {
            ...baseOpts,
            assetFrom: assetA,
            assetTo: assetB,
          } as TSwapOptions<unknown, unknown, unknown>,
          0n,
        ),
      ).rejects.toThrow(AmountTooLowError);
    });

    it('throws if hop 2 returns 0', async () => {
      instance.swapCurrency = vi
        .fn()
        .mockResolvedValueOnce({ tx: 'tx1', amountOut: 1000n })
        .mockResolvedValueOnce({ tx: 'tx2', amountOut: 0n });

      await expect(
        instance.handleMultiSwap(
          {
            ...baseOpts,
            assetFrom: assetA,
            assetTo: assetB,
          } as TSwapOptions<unknown, unknown, unknown>,
          0n,
        ),
      ).rejects.toThrow(AmountTooLowError);
    });
  });

  describe('getAmountOut', () => {
    const assetNative = {
      symbol: 'NATIVE',
      decimals: 12,
      location: { parents: 0, interior: { Here: null } },
    };

    const assetA = {
      symbol: 'A',
      location: { parents: 0, interior: { X1: [{ PalletInstance: 1 }] } },
    };

    const assetB = {
      symbol: 'B',
      location: { parents: 0, interior: { X1: [{ GeneralIndex: 2 }] } },
    };

    beforeEach(() => {
      vi.mocked(getExchangeAsset).mockReturnValue(assetNative);
      vi.mocked(getNativeAssetSymbol).mockReturnValue('NATIVE');
    });

    it('should throw when native asset not found', async () => {
      vi.mocked(getExchangeAsset).mockReturnValue(null);
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetA,
        assetTo: assetB,
      } as TSwapOptions<unknown, unknown, unknown>;
      await expect(instance.getAmountOut(opts)).rejects.toThrow(
        'Native asset not found for this exchange chain.',
      );
    });

    it('should throw when swapping native asset to itself', async () => {
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetNative,
        assetTo: assetNative,
      } as TSwapOptions<unknown, unknown, unknown>;
      await expect(instance.getAmountOut(opts)).rejects.toThrow(
        'Cannot swap native asset to itself.',
      );
    });

    it('should return amountOut for single hop when assetFrom is native', async () => {
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetNative,
        assetTo: assetB,
        origin: undefined,
      } as TSwapOptions<unknown, unknown, unknown>;

      vi.mocked(mockPolkadotApi.queryRuntimeApi).mockResolvedValueOnce(2000n);

      const amountOut = await instance.getAmountOut(opts);
      expect(amountOut).toEqual(2000n);
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenCalledTimes(1);
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenCalledWith({
        module: 'AssetConversionApi',
        method: 'quote_price_exact_tokens_for_tokens',
        params: [assetNative.location, assetB.location, 1000n, true],
      });
    });

    it('should return amountOut for single hop when assetTo is native', async () => {
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetA,
        assetTo: assetNative,
        origin: undefined,
      } as TSwapOptions<unknown, unknown, unknown>;

      vi.mocked(mockPolkadotApi.queryRuntimeApi).mockResolvedValueOnce(2000n);

      const amountOut = await instance.getAmountOut(opts);
      expect(amountOut).toEqual(2000n);
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenCalledTimes(1);
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenCalledWith({
        module: 'AssetConversionApi',
        method: 'quote_price_exact_tokens_for_tokens',
        params: [assetA.location, assetNative.location, 1000n, true],
      });
    });

    it('should return amountOut for single hop with origin fee deduction', async () => {
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetNative,
        assetTo: assetB,
        origin: {},
      } as TSwapOptions<unknown, unknown, unknown>;

      vi.mocked(mockPolkadotApi.queryRuntimeApi).mockResolvedValueOnce(2000n);

      const amountOut = await instance.getAmountOut(opts);
      expect(amountOut).toEqual(2000n);
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenCalledWith({
        module: 'AssetConversionApi',
        method: 'quote_price_exact_tokens_for_tokens',
        params: [assetNative.location, assetB.location, 990n, true],
      });
    });

    it('should handle multi-hop swap when both assets are non-native', async () => {
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetA,
        assetTo: assetB,
        origin: undefined,
      } as TSwapOptions<unknown, unknown, unknown>;

      vi.mocked(mockPolkadotApi.queryRuntimeApi)
        .mockResolvedValueOnce(1000n)
        .mockResolvedValueOnce(950n);

      const amountOut = await instance.getAmountOut(opts);
      expect(amountOut).toEqual(950n);
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenCalledTimes(2);

      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenNthCalledWith(1, {
        module: 'AssetConversionApi',
        method: 'quote_price_exact_tokens_for_tokens',
        params: [assetA.location, assetNative.location, 1000n, true],
      });

      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenNthCalledWith(2, {
        module: 'AssetConversionApi',
        method: 'quote_price_exact_tokens_for_tokens',
        params: [assetNative.location, assetB.location, 980n, true],
      });
    });

    it('should handle multi-hop swap with origin fee deduction', async () => {
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetA,
        assetTo: assetB,
        origin: {},
      } as TSwapOptions<unknown, unknown, unknown>;

      vi.mocked(mockPolkadotApi.queryRuntimeApi)
        .mockResolvedValueOnce(1000n)
        .mockResolvedValueOnce(950n);

      const amountOut = await instance.getAmountOut(opts);
      expect(amountOut).toEqual(950n);

      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenNthCalledWith(1, {
        module: 'AssetConversionApi',
        method: 'quote_price_exact_tokens_for_tokens',
        params: [assetA.location, assetNative.location, 990n, true],
      });

      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenNthCalledWith(2, {
        module: 'AssetConversionApi',
        method: 'quote_price_exact_tokens_for_tokens',
        params: [assetNative.location, assetB.location, 980n, true],
      });
    });

    it('should throw AmountTooLowError if first hop returns zero in multi-hop', async () => {
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetA,
        assetTo: assetB,
      } as TSwapOptions<unknown, unknown, unknown>;

      vi.mocked(mockPolkadotApi.queryRuntimeApi).mockResolvedValueOnce(0n);

      await expect(instance.getAmountOut(opts)).rejects.toThrow(
        `First hop (${assetA.symbol} -> ${assetNative.symbol}) resulted in zero or negative output.`,
      );
    });

    it('should throw AmountTooLowError if second hop returns zero in multi-hop', async () => {
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetA,
        assetTo: assetB,
      } as TSwapOptions<unknown, unknown, unknown>;

      vi.mocked(mockPolkadotApi.queryRuntimeApi)
        .mockResolvedValueOnce(1000n)
        .mockResolvedValueOnce(0n);

      await expect(instance.getAmountOut(opts)).rejects.toThrow(
        `Second hop (${assetNative.symbol} -> ${assetB.symbol}) resulted in zero or negative output.`,
      );
    });

    it('should throw RoutingResolutionError if queryRuntimeApi returns undefined', async () => {
      const opts = {
        ...baseSwapOptions,
        assetFrom: assetNative,
        assetTo: assetB,
      } as TSwapOptions<unknown, unknown, unknown>;

      vi.mocked(mockPolkadotApi.queryRuntimeApi).mockResolvedValueOnce(undefined);

      await expect(instance.getAmountOut(opts)).rejects.toThrow(RoutingResolutionError);
    });
  });
});
