import type { PolkadotApi, TAssetInfo } from '@paraspell/sdk-core';
import {
  AmountTooLowError,
  findNativeAssetInfoOrThrow,
  Parents,
  RoutingResolutionError,
  type TLocation,
} from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TGenericSwapOptions, TOriginInfo } from '../../types';
import AssetHubExchange from './AssetHubExchange';

vi.mock('@paraspell/sdk-core', async (importOriginal) => ({
  ...(await importOriginal()),
  findNativeAssetInfoOrThrow: vi.fn(),
  localizeLocation: vi.fn((_chain: unknown, ml: TLocation) => ml),
}));

describe('AssetHubExchange', () => {
  let instance: AssetHubExchange;
  let mockPolkadotApi: {
    queryRuntimeApi: ReturnType<typeof vi.fn>;
    deserializeExtrinsics: ReturnType<typeof vi.fn>;
  };
  let baseOptions: TGenericSwapOptions<unknown, unknown, unknown>;

  const dummyTx = { dummy: true };

  const assetNative: TAssetInfo = {
    symbol: 'NATIVE',
    decimals: 10,
    existentialDeposit: '1000',
    isNative: true,
    location: { parents: Parents.ONE, interior: { Here: null } },
  };

  const assetA: TAssetInfo = {
    symbol: 'A',
    decimals: 10,
    existentialDeposit: '1000',
    location: { parents: 0, interior: { X1: [{ PalletInstance: 1 }] } },
  };

  const assetB: TAssetInfo = {
    symbol: 'B',
    decimals: 10,
    existentialDeposit: '1000',
    location: { parents: 0, interior: { X1: [{ GeneralIndex: 2 }] } },
  };

  const origin: TOriginInfo<unknown> = { api: {}, chain: 'Hydration', assetFrom: assetA };

  const quoteCall = (from: TLocation, to: TLocation, amount: bigint) => ({
    module: 'AssetConversionApi',
    method: 'quote_price_exact_tokens_for_tokens',
    params: [from, to, amount, true],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    instance = new AssetHubExchange('AssetHubPolkadot');
    mockPolkadotApi = {
      queryRuntimeApi: vi.fn(),
      deserializeExtrinsics: vi.fn(() => dummyTx),
    };
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue(assetNative);

    baseOptions = {
      apiType: 'GENERIC',
      api: mockPolkadotApi as unknown as PolkadotApi<unknown, unknown, unknown>,
      assetFrom: assetNative,
      assetTo: assetB,
      amount: 1000n,
      sender: 'sender',
      slippagePct: '5',
      feeCalcAddress: 'sender',
      origin: undefined,
    };
  });

  describe('swapCurrency', () => {
    it('swaps native to non-native asset and converts the dest fee into assetTo', async () => {
      mockPolkadotApi.queryRuntimeApi.mockResolvedValueOnce(2000n).mockResolvedValueOnce(100n);

      const result = await instance.swapCurrency(baseOptions, 50n);

      expect(mockPolkadotApi.deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'AssetConversion',
        method: 'swap_exact_tokens_for_tokens',
        params: {
          path: [assetNative.location, assetB.location],
          amount_in: 1000n,
          amount_out_min: 1900n,
          send_to: 'sender',
          keep_alive: true,
        },
      });
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenCalledTimes(2);
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenNthCalledWith(
        1,
        quoteCall(assetNative.location, assetB.location, 1000n),
      );
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenNthCalledWith(
        2,
        quoteCall({ parents: Parents.ONE, interior: { Here: null } }, assetB.location, 50n),
      );
      expect(result).toEqual({ tx: dummyTx, amountOut: 1890n });
    });

    it('swaps non-native to native asset with origin fee deduction and no fee conversion', async () => {
      mockPolkadotApi.queryRuntimeApi.mockResolvedValueOnce(2000n);

      const result = await instance.swapCurrency(
        {
          ...baseOptions,
          assetFrom: assetA,
          assetTo: assetNative,
          origin,
        },
        50n,
      );

      expect(mockPolkadotApi.deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'AssetConversion',
        method: 'swap_exact_tokens_for_tokens',
        params: {
          path: [assetA.location, assetNative.location],
          amount_in: 990n,
          amount_out_min: 1900n,
          send_to: 'sender',
          keep_alive: false,
        },
      });
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenCalledExactlyOnceWith(
        quoteCall(assetA.location, assetNative.location, 990n),
      );
      expect(result).toEqual({ tx: dummyTx, amountOut: 1945n });
    });

    it('swaps two non-native assets in a single extrinsic routed through native asset', async () => {
      mockPolkadotApi.queryRuntimeApi
        .mockResolvedValueOnce(500n)
        .mockResolvedValueOnce(2000n)
        .mockResolvedValueOnce(100n);

      const result = await instance.swapCurrency(
        { ...baseOptions, assetFrom: assetA, assetTo: assetB },
        50n,
      );

      expect(mockPolkadotApi.deserializeExtrinsics).toHaveBeenCalledExactlyOnceWith({
        module: 'AssetConversion',
        method: 'swap_exact_tokens_for_tokens',
        params: {
          path: [assetA.location, assetNative.location, assetB.location],
          amount_in: 1000n,
          amount_out_min: 1900n,
          send_to: 'sender',
          keep_alive: false,
        },
      });
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenNthCalledWith(
        1,
        quoteCall(assetA.location, assetNative.location, 1000n),
      );
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenNthCalledWith(
        2,
        quoteCall(assetNative.location, assetB.location, 500n),
      );
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenNthCalledWith(
        3,
        quoteCall({ parents: Parents.ONE, interior: { Here: null } }, assetB.location, 50n),
      );
      expect(result).toEqual({ tx: dummyTx, amountOut: 1890n });
    });

    it('skips the fee conversion quote when toDestTxFee is zero', async () => {
      mockPolkadotApi.queryRuntimeApi.mockResolvedValueOnce(2000n);

      const result = await instance.swapCurrency(baseOptions, 0n);

      expect(result).toEqual({ tx: dummyTx, amountOut: 2000n });
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenCalledTimes(1);
    });

    it('throws AmountTooLowError if dest fee exceeds the amount out', async () => {
      mockPolkadotApi.queryRuntimeApi.mockResolvedValueOnce(100n).mockResolvedValueOnce(10000000n);

      await expect(instance.swapCurrency(baseOptions, 50000n)).rejects.toThrow(AmountTooLowError);
    });

    it('throws AmountTooLowError if an intermediate hop returns zero', async () => {
      mockPolkadotApi.queryRuntimeApi.mockResolvedValueOnce(0n);

      await expect(
        instance.swapCurrency({ ...baseOptions, assetFrom: assetA, assetTo: assetB }, 0n),
      ).rejects.toThrow('First hop (A -> NATIVE) resulted in zero or negative output.');
      expect(mockPolkadotApi.deserializeExtrinsics).not.toHaveBeenCalled();
    });

    it('throws RoutingResolutionError if queryRuntimeApi returns undefined', async () => {
      mockPolkadotApi.queryRuntimeApi.mockResolvedValueOnce(undefined);

      await expect(instance.swapCurrency(baseOptions, 0n)).rejects.toThrow(RoutingResolutionError);
    });

    it('throws when swapping native asset to itself', async () => {
      await expect(
        instance.swapCurrency({ ...baseOptions, assetTo: assetNative }, 0n),
      ).rejects.toThrow('Cannot swap asset to itself.');
    });
  });

  describe('getAmountOut', () => {
    it('throws when swapping native asset to itself', async () => {
      await expect(instance.getAmountOut({ ...baseOptions, assetTo: assetNative })).rejects.toThrow(
        'Cannot swap asset to itself.',
      );
    });

    it('returns the quote for single hop when assetFrom is native', async () => {
      mockPolkadotApi.queryRuntimeApi.mockResolvedValueOnce(2000n);

      const amountOut = await instance.getAmountOut(baseOptions);

      expect(amountOut).toBe(2000n);
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenCalledExactlyOnceWith(
        quoteCall(assetNative.location, assetB.location, 1000n),
      );
    });

    it('returns the quote for single hop when assetTo is native', async () => {
      mockPolkadotApi.queryRuntimeApi.mockResolvedValueOnce(2000n);

      const amountOut = await instance.getAmountOut({
        ...baseOptions,
        assetFrom: assetA,
        assetTo: assetNative,
      });

      expect(amountOut).toBe(2000n);
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenCalledExactlyOnceWith(
        quoteCall(assetA.location, assetNative.location, 1000n),
      );
    });

    it('returns amountOut for single hop with origin fee deduction', async () => {
      mockPolkadotApi.queryRuntimeApi.mockResolvedValueOnce(2000n);

      const amountOut = await instance.getAmountOut({
        ...baseOptions,
        origin,
      });

      expect(amountOut).toBe(2000n);
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenCalledExactlyOnceWith(
        quoteCall(assetNative.location, assetB.location, 990n),
      );
    });

    it('chains quotes through native asset when both assets are non-native', async () => {
      mockPolkadotApi.queryRuntimeApi.mockResolvedValueOnce(500n).mockResolvedValueOnce(950n);

      const amountOut = await instance.getAmountOut({
        ...baseOptions,
        assetFrom: assetA,
        assetTo: assetB,
      });

      expect(amountOut).toBe(950n);
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenCalledTimes(2);
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenNthCalledWith(
        1,
        quoteCall(assetA.location, assetNative.location, 1000n),
      );
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenNthCalledWith(
        2,
        quoteCall(assetNative.location, assetB.location, 500n),
      );
    });

    it('chains quotes with origin fee deduction applied once', async () => {
      mockPolkadotApi.queryRuntimeApi.mockResolvedValueOnce(500n).mockResolvedValueOnce(950n);

      const amountOut = await instance.getAmountOut({
        ...baseOptions,
        assetFrom: assetA,
        assetTo: assetB,
        origin,
      });

      expect(amountOut).toBe(950n);
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenNthCalledWith(
        1,
        quoteCall(assetA.location, assetNative.location, 990n),
      );
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenNthCalledWith(
        2,
        quoteCall(assetNative.location, assetB.location, 500n),
      );
    });

    it('throws AmountTooLowError if first hop returns zero', async () => {
      mockPolkadotApi.queryRuntimeApi.mockResolvedValueOnce(0n);

      await expect(
        instance.getAmountOut({ ...baseOptions, assetFrom: assetA, assetTo: assetB }),
      ).rejects.toThrow('First hop (A -> NATIVE) resulted in zero or negative output.');
      expect(mockPolkadotApi.queryRuntimeApi).toHaveBeenCalledTimes(1);
    });

    it('throws RoutingResolutionError if queryRuntimeApi returns undefined', async () => {
      mockPolkadotApi.queryRuntimeApi.mockResolvedValueOnce(undefined);

      await expect(instance.getAmountOut(baseOptions)).rejects.toThrow(RoutingResolutionError);
    });
  });
});
