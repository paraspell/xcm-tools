import type {
  PolkadotApi,
  TAssetInfo,
  TExchangeChain,
  TXcmFeeDetailWithForwardedXcm,
} from '@paraspell/sdk-core';
import { DryRunFailedError, getOriginXcmFee } from '@paraspell/sdk-core';
import type { PolkadotClient } from 'polkadot-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type {
  TBuildTransactionsOptions,
  TDestinationInfo,
  TOriginInfo,
  TTransformedOptions,
} from '../types';
import { getSwapFee } from './fees';
import { getSwapOriginFee } from './getSwapOriginFee';
import { getToExchangeOriginFee } from './utils';

vi.mock('./fees');
vi.mock('./utils', async (importActual) => ({
  ...(await importActual()),
  getToExchangeOriginFee: vi.fn(),
}));

vi.mock('@paraspell/sdk-core', async (importActual) => ({
  ...(await importActual()),
  getOriginXcmFee: vi.fn(),
  handleSwapExecuteTransfer: vi.fn(),
}));

const mockApi = {} as PolkadotApi<unknown, unknown, unknown>;

describe('getSwapOriginFee', () => {
  let dex: ExchangeChain;
  let exchangeChain: TExchangeChain;
  let options: TTransformedOptions<
    TBuildTransactionsOptions<unknown, unknown, unknown>,
    unknown,
    unknown,
    unknown
  >;

  const swapFee = {
    fee: 1234n,
    feeType: 'dryRun',
    asset: { symbol: 'FOO' },
  } as TXcmFeeDetailWithForwardedXcm<false>;
  const swapAmountOut = 5000n;
  const toExchangeOriginValue = {
    fee: 10n,
    feeType: 'dryRun',
    asset: { symbol: 'BAR' },
  } as TXcmFeeDetailWithForwardedXcm<false>;
  const executeOriginValue = {
    fee: 100n,
    feeType: 'dryRun',
    asset: { symbol: 'EXECUTE' },
  } as TXcmFeeDetailWithForwardedXcm<false>;

  beforeEach(() => {
    dex = {
      chain: 'SomeOtherDex',
      getAmountOut: vi.fn().mockResolvedValue(5000n),
    } as unknown as ExchangeChain;
    exchangeChain = 'AssetHubPolkadot';

    options = {
      exchange: {
        chain: exchangeChain,
        api: {} as PolkadotApi<unknown, unknown, unknown>,
        apiPapi: {} as PolkadotClient,
        assetFrom: { symbol: 'DOT', decimals: 10 } as TAssetInfo,
        assetTo: { symbol: 'USDT' } as TAssetInfo,
      },
      sender: '0xdeadbeef',
      amount: 1000n,
      api: mockApi,
    } as TTransformedOptions<
      TBuildTransactionsOptions<unknown, unknown, unknown>,
      unknown,
      unknown,
      unknown
    >;

    vi.clearAllMocks();
    vi.mocked(getSwapFee).mockResolvedValue({
      result: swapFee,
      amountOut: swapAmountOut,
    });
    vi.mocked(getToExchangeOriginFee).mockResolvedValue(toExchangeOriginValue);
    vi.mocked(getOriginXcmFee).mockResolvedValue(executeOriginValue);
  });

  describe('Execute transfer path', () => {
    it('uses execute path for AssetHub DEX with origin', async () => {
      const assetHubDex = {
        chain: 'AssetHubPolkadot',
        getAmountOut: vi.fn().mockResolvedValue(5000n),
      } as unknown as ExchangeChain;

      options.origin = {
        chain: 'Acala',
        assetFrom: { symbol: 'ACA' },
      } as TOriginInfo<unknown>;

      const result = await getSwapOriginFee(assetHubDex, options, false);

      expect(getOriginXcmFee).toHaveBeenCalledTimes(1);
      expect(getToExchangeOriginFee).not.toHaveBeenCalled();
      expect(getSwapFee).not.toHaveBeenCalled();
      expect(result).toEqual(executeOriginValue);
    });

    it('uses execute path for Hydration DEX with destination', async () => {
      const hydrationDex = {
        chain: 'Hydration',
        getAmountOut: vi.fn().mockResolvedValue(5000n),
      } as unknown as ExchangeChain;

      options.destination = { chain: 'Moonbeam' } as unknown as TDestinationInfo;
      options.exchange = {
        ...options.exchange,
        chain: 'Hydration',
      };

      const result = await getSwapOriginFee(hydrationDex, options, false);

      expect(getOriginXcmFee).toHaveBeenCalledTimes(1);
      expect(result).toEqual(executeOriginValue);
    });

    it('falls back to routed path when execute fails with Filtered error', async () => {
      const assetHubDex = {
        chain: 'AssetHubPolkadot',
        getAmountOut: vi.fn().mockResolvedValue(5000n),
      } as unknown as ExchangeChain;

      options.origin = { chain: 'Acala' } as unknown as TOriginInfo<unknown>;

      vi.mocked(getOriginXcmFee).mockRejectedValueOnce(new DryRunFailedError('Filtered', 'origin'));

      const result = await getSwapOriginFee(assetHubDex, options, false);

      expect(getToExchangeOriginFee).toHaveBeenCalledWith(
        expect.objectContaining({ origin: { chain: 'Acala' } }),
        false,
      );
      expect(result).toEqual(toExchangeOriginValue);
    });

    it('rethrows non-Filtered DryRunFailedError', async () => {
      const assetHubDex = {
        chain: 'AssetHubPolkadot',
        getAmountOut: vi.fn().mockResolvedValue(5000n),
      } as unknown as ExchangeChain;

      options.origin = { chain: 'Acala' } as unknown as TOriginInfo<unknown>;

      vi.mocked(getOriginXcmFee).mockRejectedValueOnce(new DryRunFailedError('Other', 'origin'));

      await expect(getSwapOriginFee(assetHubDex, options, false)).rejects.toBeInstanceOf(
        DryRunFailedError,
      );
    });
  });

  describe('Routed path', () => {
    it('returns origin->exchange fee when origin chain differs from exchange', async () => {
      options.origin = {
        chain: 'Acala',
        assetFrom: { symbol: 'ACA' },
      } as TOriginInfo<unknown>;

      const result = await getSwapOriginFee(dex, options, false);

      expect(getToExchangeOriginFee).toHaveBeenCalledWith(
        expect.objectContaining({ origin: options.origin }),
        false,
      );
      expect(getSwapFee).not.toHaveBeenCalled();
      expect(result).toEqual(toExchangeOriginValue);
    });

    it('returns swap fee when origin is undefined (origin chain == exchange)', async () => {
      const result = await getSwapOriginFee(dex, options, false);

      expect(getSwapFee).toHaveBeenCalledWith(dex, options, false);
      expect(getToExchangeOriginFee).not.toHaveBeenCalled();
      expect(result).toEqual(swapFee);
    });

    it('returns swap fee when origin chain equals exchange chain', async () => {
      options.origin = {
        chain: exchangeChain,
        assetFrom: { symbol: 'DOT' },
      } as TOriginInfo<unknown>;

      const result = await getSwapOriginFee(dex, options, false);

      expect(getSwapFee).toHaveBeenCalledWith(dex, options, false);
      expect(getToExchangeOriginFee).not.toHaveBeenCalled();
      expect(result).toEqual(swapFee);
    });

    it('forwards disableFallback flag to underlying calls', async () => {
      options.origin = { chain: 'Acala' } as TOriginInfo<unknown>;

      await getSwapOriginFee(dex, options, true);

      expect(getToExchangeOriginFee).toHaveBeenCalledWith(expect.any(Object), true);
    });
  });
});
