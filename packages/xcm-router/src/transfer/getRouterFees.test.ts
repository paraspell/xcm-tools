import type {
  TAssetInfo,
  TGetXcmFeeResult,
  TPapiTransaction,
  TParachain,
  TXcmFeeDetail,
} from '@paraspell/sdk';
import { DryRunFailedError, getXcmFee, handleSwapExecuteTransfer } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type {
  TBuildTransactionsOptionsModified,
  TDestinationInfo,
  TOriginInfo,
  TRouterXcmFeeHopInfo,
  TRouterXcmFeeResult,
} from '../types';
import { getSwapFee } from './fees';
import { getRouterFees } from './getRouterFees';
import { getFromExchangeFee, getToExchangeFee } from './utils';

vi.mock('./fees');
vi.mock('./utils');

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    getXcmFee: vi.fn(),
    handleSwapExecuteTransfer: vi.fn(),
  };
});

describe('getRouterFees', () => {
  let dex: ExchangeChain;
  let baseChain: TParachain;
  let options: TBuildTransactionsOptionsModified;

  const swapFee = { fee: 1234n, currency: 'FOO' } as TXcmFeeDetail;
  const swapAmountOut = 5000n;
  const toExchangeFeeValue = {
    origin: { fee: 10n, currency: 'BAR' } as TXcmFeeDetail,
    destination: { fee: 15n, currency: 'BAR' } as TXcmFeeDetail,
    hops: [{ chain: 'AssetHubPolkadot', result: { fee: 5n, currency: 'DOT' } }],
  } as TGetXcmFeeResult;
  const toDestFeeValue = {
    origin: { fee: 20n, currency: 'BAZ' } as TXcmFeeDetail,
    destination: { fee: 25n, currency: 'BAZ' } as TXcmFeeDetail,
    hops: [{ chain: 'AssetHubKusama', result: { fee: 3n, currency: 'KSM' } }],
  } as TGetXcmFeeResult;
  const executeTransferResult = {
    origin: { fee: 100n, currency: 'EXECUTE' } as TXcmFeeDetail,
    destination: { fee: 200n, currency: 'EXECUTE' } as TXcmFeeDetail,
    hops: [
      { chain: 'AssetHubPolkadot', result: { fee: 50n, currency: 'DOT' } },
      { chain: 'Hydration', result: { fee: 75n, currency: 'HDX' } },
    ],
  } as TGetXcmFeeResult;

  beforeEach(() => {
    dex = {
      get chain() {
        return 'SomeOtherDex';
      },
      getAmountOut: vi.fn().mockResolvedValue(5000n),
    } as unknown as ExchangeChain;
    baseChain = 'AssetHubPolkadot' as TParachain;

    options = {
      exchange: {
        baseChain: baseChain,
        exchangeChain: 'HydrationDex',
        api: {},
        apiPapi: {},
        assetFrom: { symbol: 'DOT', decimals: 10 },
        assetTo: { symbol: 'USDT' },
      },
      senderAddress: '0xdeadbeef',
      amount: '1000',
    } as TBuildTransactionsOptionsModified;

    vi.clearAllMocks();
    vi.mocked(getSwapFee).mockResolvedValue({
      result: swapFee,
      amountOut: swapAmountOut.toString(),
    });
    vi.mocked(getToExchangeFee).mockResolvedValue(toExchangeFeeValue);
    vi.mocked(getFromExchangeFee).mockResolvedValue(toDestFeeValue);
    vi.mocked(getXcmFee).mockResolvedValue(executeTransferResult);
    vi.mocked(handleSwapExecuteTransfer).mockResolvedValue(
      'mock-tx' as unknown as TPapiTransaction,
    );
  });

  describe('Execute transfer path', () => {
    it('uses execute transfer for AssetHub DEX with origin', async () => {
      const assetHubDex = {
        get chain() {
          return 'AssetHubPolkadot';
        },
        getAmountOut: vi.fn().mockResolvedValue(5000n),
      } as unknown as ExchangeChain;

      options.origin = { chain: 'Acala', assetFrom: { symbol: 'ACA' } } as unknown as TOriginInfo;

      const result = await getRouterFees(assetHubDex, options);

      expect(result).toEqual({
        ...executeTransferResult,
        origin: {
          ...executeTransferResult.origin,
        },
        destination: {
          ...executeTransferResult.destination,
          isExchange: true,
        },
        hops: [
          { chain: 'AssetHubPolkadot', result: { fee: 50n, currency: 'DOT' }, isExchange: true },
          { chain: 'Hydration', result: { fee: 75n, currency: 'HDX' } },
        ],
      });
    });

    it('falls back to separate transactions when execute transfer fails with Filtered error', async () => {
      const assetHubDex = {
        get chain() {
          return 'AssetHubPolkadot';
        },
        getAmountOut: vi.fn().mockResolvedValue(5000n),
      } as unknown as ExchangeChain;

      options.origin = { chain: 'Acala' } as unknown as TOriginInfo;

      vi.mocked(getXcmFee).mockRejectedValueOnce(new DryRunFailedError('Filtered', 'origin'));

      const result = await getRouterFees(assetHubDex, options);

      expect(getSwapFee).toHaveBeenCalled();
      expect(Array.isArray(result.hops)).toBe(true);
    });
  });

  describe('Separate transactions path', () => {
    it('returns only swap when origin & destination are undefined - no exchange in hops', async () => {
      const result = await getRouterFees(dex, options);

      expect(result).toEqual<TRouterXcmFeeResult>({
        failureReason: undefined,
        failureChain: undefined,
        origin: { ...swapFee, isExchange: true },
        destination: { ...swapFee, isExchange: true, fee: 0n },
        hops: [],
      });
    });

    it('adds exchange to hops only when origin exists but destination undefined', async () => {
      options.origin = { chain: 'Acala', amount: 1000n } as unknown as TOriginInfo;

      const result = await getRouterFees(dex, options);

      expect(result.hops).toEqual([...toExchangeFeeValue.hops]);
      expect(result.origin).toEqual(toExchangeFeeValue.origin);
      expect(result.destination).toEqual({ ...swapFee, isExchange: true });
    });

    it('adds exchange to hops only when destination exists but origin undefined', async () => {
      options.destination = { chain: 'Moonbeam', min: 0n } as unknown as TDestinationInfo;

      const result = await getRouterFees(dex, options);

      expect(result.hops).toEqual([...toDestFeeValue.hops]);
      expect(result.origin).toEqual({ ...swapFee, isExchange: true });
      expect(result.destination).toEqual(toDestFeeValue.destination);
    });

    it('handles both origin and destination - exchange added to hops', async () => {
      options.origin = { chain: 'Acala' } as unknown as TOriginInfo;
      options.destination = { chain: 'Moonbeam' } as unknown as TDestinationInfo;

      const result = await getRouterFees(dex, options);

      expect(result).toEqual<TRouterXcmFeeResult>({
        failureReason: undefined,
        failureChain: undefined,
        origin: toExchangeFeeValue.origin,
        destination: toDestFeeValue.destination,
        hops: [
          ...toExchangeFeeValue.hops,
          {
            chain: baseChain,
            result: {
              ...swapFee,
              fee: (swapFee.fee ?? 0n) + (toDestFeeValue.origin.fee ?? 0n),
            },
            isExchange: true,
          },
          ...toDestFeeValue.hops,
        ],
      });
    });

    it('includes failure information when sending chain fails', async () => {
      options.origin = { chain: 'Acala' } as unknown as TOriginInfo;
      const failedToExchangeFee = {
        ...toExchangeFeeValue,
        failureReason: 'InsufficientBalance',
        failureChain: 'origin' as const,
      } as TGetXcmFeeResult<false>;
      vi.mocked(getToExchangeFee).mockResolvedValue(failedToExchangeFee);

      const result = await getRouterFees(dex, options);

      expect(result.failureReason).toBe('InsufficientBalance');
      expect(result.failureChain).toBe('origin');
    });
  });

  it('uses execute transfer for Hydration DEX with destination only (origin undefined)', async () => {
    const hydrationDex = {
      get chain() {
        return 'Hydration';
      },
      getAmountOut: vi.fn().mockResolvedValue(5000n),
    } as unknown as ExchangeChain;

    const localOptions = {
      ...options,
      destination: { chain: 'Moonbeam' },
    } as TBuildTransactionsOptionsModified;

    const result = await getRouterFees(hydrationDex, localOptions);

    expect(result.origin).toEqual(
      expect.objectContaining({ currency: executeTransferResult.origin.currency }),
    );
    expect(result.origin.isExchange).toBe(true);
    expect(result.destination.isExchange).toBeUndefined();

    expect(
      result.hops.some(
        (h) =>
          h.chain === localOptions.exchange.baseChain && (h as TRouterXcmFeeHopInfo).isExchange,
      ),
    ).toBe(true);
  });

  it('rethrows when execute transfer fails with a non-Filtered DryRunFailedError', async () => {
    const assetHubDex = {
      get chain() {
        return 'AssetHubPolkadot';
      },
      getAmountOut: vi.fn().mockResolvedValue(5000n),
    } as unknown as ExchangeChain;

    const localOptions = {
      ...options,
      origin: { chain: 'Acala' },
    } as TBuildTransactionsOptionsModified;

    vi.mocked(getXcmFee).mockRejectedValueOnce(new DryRunFailedError('Other', 'origin'));

    await expect(getRouterFees(assetHubDex, localOptions)).rejects.toBeInstanceOf(
      DryRunFailedError,
    );
  });

  it('calls getXcmFee with buildTx factory and swapConfig using main amountOut', async () => {
    const assetHubDex = {
      get chain() {
        return 'AssetHubPolkadot';
      },
      getAmountOut: vi.fn().mockResolvedValue(5000n),
    } as unknown as ExchangeChain;

    const localOptions = {
      ...options,
      origin: { chain: 'Acala' },
      destination: { chain: 'Moonbeam' },
    } as TBuildTransactionsOptionsModified;

    await getRouterFees(assetHubDex, localOptions);

    expect(getXcmFee).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(getXcmFee).mock.calls[0][0];

    expect(arg).toEqual(
      expect.objectContaining({
        buildTx: expect.any(Function),
        origin: 'Acala',
        destination: 'Moonbeam',
        senderAddress: options.senderAddress,
        address: options.senderAddress,
        disableFallback: false,
        swapConfig: expect.objectContaining({
          exchangeChain: localOptions.exchange.baseChain,
          amountOut: 5000n,
        }),
      }),
    );
    expect(arg.currency).toEqual(expect.objectContaining({ amount: BigInt(options.amount) }));
  });

  it('calculateMinAmountOut forwards amount and provided assetTo to dex.getAmountOut', async () => {
    const assetHubDex = {
      get chain() {
        return 'AssetHubPolkadot';
      },
      getAmountOut: vi.fn().mockResolvedValue(999n),
    } as unknown as ExchangeChain;

    const localOptions = {
      ...options,
      origin: { chain: 'Acala' },
    } as TBuildTransactionsOptionsModified;

    await getRouterFees(assetHubDex, localOptions);

    const buildTx = vi.mocked(getXcmFee).mock.calls[0][0].buildTx as (
      a?: string,
    ) => Promise<unknown>;
    await buildTx();

    const arg = vi.mocked(handleSwapExecuteTransfer).mock.calls[0][0] as {
      calculateMinAmountOut: (amountIn: bigint, assetTo?: TAssetInfo) => Promise<unknown>;
    };

    const spy = vi.spyOn(assetHubDex, 'getAmountOut');

    const customAssetTo = { symbol: 'USDC' } as TAssetInfo;
    await arg.calculateMinAmountOut(123n, customAssetTo);

    expect(spy).toHaveBeenLastCalledWith(
      localOptions.exchange.api,
      expect.objectContaining({
        amount: '123',
        papiApi: localOptions.exchange.apiPapi,
        assetFrom: localOptions.exchange.assetFrom,
        assetTo: customAssetTo,
        slippagePct: '1',
      }),
    );
  });

  it('calculateMinAmountOut defaults assetTo to options.exchange.assetTo when not provided', async () => {
    const hydrationDex = {
      get chain() {
        return 'Hydration';
      },
      getAmountOut: vi.fn().mockResolvedValue(111n),
    } as unknown as ExchangeChain;

    const localOptions = {
      ...options,
      destination: { chain: 'Moonbeam' },
    } as TBuildTransactionsOptionsModified;

    await getRouterFees(hydrationDex, localOptions);

    const buildTx = vi.mocked(getXcmFee).mock.calls[0][0].buildTx as (
      a?: string,
    ) => Promise<unknown>;
    await buildTx();

    const arg = vi.mocked(handleSwapExecuteTransfer).mock.calls[0][0] as {
      calculateMinAmountOut: (amountIn: bigint, assetTo?: TAssetInfo) => Promise<unknown>;
    };

    const spy = vi.spyOn(hydrationDex, 'getAmountOut');

    await arg.calculateMinAmountOut(777n);

    expect(spy).toHaveBeenLastCalledWith(
      localOptions.exchange.api,
      expect.objectContaining({
        amount: '777',
        papiApi: localOptions.exchange.apiPapi,
        assetFrom: localOptions.exchange.assetFrom,
        assetTo: localOptions.exchange.assetTo,
        slippagePct: '1',
      }),
    );
  });
});
