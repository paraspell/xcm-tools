import type {
  PolkadotApi,
  TAssetInfo,
  TExchangeChain,
  TGetXcmFeeResult,
  TXcmFeeDetail,
} from '@paraspell/sdk-core';
import {
  DryRunFailedError,
  getXcmFee,
  handleSwapExecuteTransfer,
  RoutingResolutionError,
} from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type {
  TBuildTransactionsOptions,
  TDestinationInfo,
  TOriginInfo,
  TTransformedOptions,
} from '../types';
import { getSwapFee } from './fees';
import { getRouterFees } from './getRouterFees';
import { getFromExchangeFee, getToExchangeFee } from './utils';

vi.mock('./fees');
vi.mock('./utils');

vi.mock('@paraspell/sdk-core', async () => {
  const actual = await vi.importActual('@paraspell/sdk-core');
  return {
    ...actual,
    getXcmFee: vi.fn(),
    handleSwapExecuteTransfer: vi.fn(),
  };
});

const mockApi = {} as PolkadotApi<unknown, unknown, unknown>;

describe('getRouterFees', () => {
  let dex: ExchangeChain;
  let exchangeChain: TExchangeChain;
  let options: TTransformedOptions<
    TBuildTransactionsOptions<unknown, unknown, unknown>,
    unknown,
    unknown,
    unknown
  >;

  const swapFee = { fee: 1234n, asset: { symbol: 'FOO' } } as TXcmFeeDetail;
  const swapAmountOut = 5000n;
  const toExchangeFeeValue = {
    origin: { fee: 10n, asset: { symbol: 'BAR' } } as TXcmFeeDetail,
    destination: { fee: 15n, asset: { symbol: 'BAR' } } as TXcmFeeDetail,
    hops: [{ chain: 'AssetHubPolkadot', result: { fee: 5n, asset: { symbol: 'DOT' } } }],
  } as TGetXcmFeeResult;
  const toDestFeeValue = {
    origin: { fee: 20n, asset: { symbol: 'BAZ' } } as TXcmFeeDetail,
    destination: { fee: 25n, asset: { symbol: 'BAZ' } } as TXcmFeeDetail,
    hops: [{ chain: 'AssetHubKusama', result: { fee: 3n, asset: { symbol: 'KSM' } } }],
  } as TGetXcmFeeResult;
  const executeTransferResult = {
    origin: { fee: 100n, asset: { symbol: 'EXECUTE' } } as TXcmFeeDetail,
    destination: { fee: 200n, asset: { symbol: 'EXECUTE' } } as TXcmFeeDetail,
    hops: [
      { chain: 'AssetHubPolkadot', result: { fee: 50n, asset: { symbol: 'DOT' } } },
      { chain: 'Hydration', result: { fee: 75n, asset: { symbol: 'HDX' } } },
    ],
  } as TGetXcmFeeResult;

  beforeEach(() => {
    dex = {
      chain: 'SomeOtherDex',
      getAmountOut: vi.fn().mockResolvedValue(5000n),
    } as unknown as ExchangeChain;
    exchangeChain = 'AssetHubPolkadot';

    options = {
      exchange: {
        chain: exchangeChain,
        api: {},
        apiPapi: {},
        assetFrom: { symbol: 'DOT', decimals: 10 },
        assetTo: { symbol: 'USDT' },
      },
      senderAddress: '0xdeadbeef',
      amount: '1000',
      api: mockApi,
    } as unknown as TTransformedOptions<
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
    vi.mocked(getToExchangeFee).mockResolvedValue(toExchangeFeeValue);
    vi.mocked(getFromExchangeFee).mockResolvedValue(toDestFeeValue);
    vi.mocked(getXcmFee).mockResolvedValue(executeTransferResult);
    vi.mocked(handleSwapExecuteTransfer).mockResolvedValue('mock-tx');
  });

  describe('Execute transfer path', () => {
    it('uses execute transfer for AssetHub DEX with origin', async () => {
      const assetHubDex = {
        get chain() {
          return 'AssetHubPolkadot';
        },
        getAmountOut: vi.fn().mockResolvedValue(5000n),
      } as unknown as ExchangeChain;

      options.origin = {
        chain: 'Acala',
        assetFrom: { symbol: 'ACA' },
      } as unknown as TOriginInfo<unknown>;

      const result = await getRouterFees(assetHubDex, options, false);

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
          {
            chain: 'AssetHubPolkadot',
            result: { fee: 50n, asset: { symbol: 'DOT' }, isExchange: true },
          },
          { chain: 'Hydration', result: { fee: 75n, asset: { symbol: 'HDX' } } },
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

      options.origin = { chain: 'Acala' } as unknown as TOriginInfo<unknown>;

      vi.mocked(getXcmFee).mockRejectedValueOnce(new DryRunFailedError('Filtered', 'origin'));

      const result = await getRouterFees(assetHubDex, options, false);

      expect(getSwapFee).toHaveBeenCalled();
      expect(Array.isArray(result.hops)).toBe(true);
    });
  });

  describe('Separate transactions path', () => {
    it('returns only swap when origin & destination are undefined - no exchange in hops', async () => {
      const result = await getRouterFees(dex, options, false);

      expect(result).toEqual<TGetXcmFeeResult>({
        failureReason: undefined,
        failureChain: undefined,
        origin: { ...swapFee, isExchange: true },
        destination: { ...swapFee, isExchange: true, fee: 0n },
        hops: [],
      });
    });

    it('adds exchange to hops only when origin exists but destination undefined', async () => {
      options.origin = { chain: 'Acala', amount: 1000n } as unknown as TOriginInfo<unknown>;

      const result = await getRouterFees(dex, options, false);

      expect(result.hops).toEqual([...toExchangeFeeValue.hops]);
      expect(result.origin).toEqual(toExchangeFeeValue.origin);
      expect(result.destination).toEqual({ ...swapFee, isExchange: true });
    });

    it('adds exchange to hops only when destination exists but origin undefined', async () => {
      options.destination = { chain: 'Moonbeam', min: 0n } as unknown as TDestinationInfo;

      const result = await getRouterFees(dex, options, false);

      expect(result.hops).toEqual([...toDestFeeValue.hops]);
      expect(result.origin).toEqual({ ...swapFee, isExchange: true });
      expect(result.destination).toEqual(toDestFeeValue.destination);
    });

    it('handles both origin and destination - exchange added to hops', async () => {
      options.origin = { chain: 'Acala' } as unknown as TOriginInfo<unknown>;
      options.destination = { chain: 'Moonbeam' } as unknown as TDestinationInfo;

      const result = await getRouterFees(dex, options, false);

      expect(result).toEqual<TGetXcmFeeResult>({
        failureReason: undefined,
        failureChain: undefined,
        origin: toExchangeFeeValue.origin,
        destination: toDestFeeValue.destination,
        hops: [
          ...toExchangeFeeValue.hops,
          {
            chain: exchangeChain,
            result: {
              ...swapFee,
              fee: (swapFee.fee ?? 0n) + (toDestFeeValue.origin.fee ?? 0n),
              isExchange: true,
            },
          },
          ...toDestFeeValue.hops,
        ],
      });
    });

    it('includes failure information when sending chain fails', async () => {
      options.origin = { chain: 'Acala' } as unknown as TOriginInfo<unknown>;
      const failedToExchangeFee = {
        ...toExchangeFeeValue,
        failureReason: 'InsufficientBalance',
        failureChain: 'origin',
      } as TGetXcmFeeResult<false>;
      vi.mocked(getToExchangeFee).mockResolvedValue(failedToExchangeFee);

      const result = await getRouterFees(dex, options, false);

      expect(result.failureReason).toBe('InsufficientBalance');
      expect(result.failureChain).toBe('origin');
    });
  });

  it('uses execute transfer for AssetHub DEX with destination only (origin undefined)', async () => {
    const assetHubDex = {
      chain: 'AssetHubPolkadot',
      getAmountOut: vi.fn().mockResolvedValue(5000n),
    } as unknown as ExchangeChain;

    const localOptions = {
      ...options,
      destination: { chain: 'Moonbeam' },
    } as TTransformedOptions<
      TBuildTransactionsOptions<unknown, unknown, unknown>,
      unknown,
      unknown,
      unknown
    >;

    const result = await getRouterFees(assetHubDex, localOptions, false);

    expect(result.origin).toEqual(
      expect.objectContaining({ asset: executeTransferResult.origin.asset }),
    );
    expect(result.origin.isExchange).toBe(true);
    expect(result.destination.isExchange).toBeUndefined();

    expect(
      result.hops.some((h) => h.chain === localOptions.exchange.chain && h.result.isExchange),
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
    } as TTransformedOptions<
      TBuildTransactionsOptions<unknown, unknown, unknown>,
      unknown,
      unknown,
      unknown
    >;

    vi.mocked(getXcmFee).mockRejectedValueOnce(new DryRunFailedError('Other', 'origin'));

    await expect(getRouterFees(assetHubDex, localOptions, false)).rejects.toBeInstanceOf(
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
    } as TTransformedOptions<
      TBuildTransactionsOptions<unknown, unknown, unknown>,
      unknown,
      unknown,
      unknown
    >;

    await getRouterFees(assetHubDex, localOptions, false);

    expect(getXcmFee).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(getXcmFee).mock.calls[0][0];

    expect(arg).toEqual(
      expect.objectContaining({
        buildTx: expect.any(Function),
        origin: 'Acala',
        destination: 'Moonbeam',
        sender: options.sender,
        recipient: options.sender,
        disableFallback: false,
        swapConfig: expect.objectContaining({
          exchangeChain: localOptions.exchange.chain,
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
    } as TTransformedOptions<
      TBuildTransactionsOptions<unknown, unknown, unknown>,
      unknown,
      unknown,
      unknown
    >;

    await getRouterFees(assetHubDex, localOptions, false);

    const buildTx = vi.mocked(getXcmFee).mock.calls[0][0].buildTx;
    await buildTx();

    const arg = vi.mocked(handleSwapExecuteTransfer).mock.calls[0][0] as {
      calculateMinAmountOut: (amountIn: bigint, assetTo?: TAssetInfo) => Promise<unknown>;
    };

    const spy = vi.spyOn(assetHubDex, 'getAmountOut');

    const customAssetTo = { symbol: 'USDC' } as TAssetInfo;
    await arg.calculateMinAmountOut(123n, customAssetTo);

    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        apiPjs: localOptions.exchange.apiPjs,
        amount: 123n,
        assetFrom: localOptions.exchange.assetFrom,
        assetTo: customAssetTo,
        slippagePct: '1',
      }),
    );
  });

  it('calculateMinAmountOut defaults assetTo to options.exchange.assetTo when not provided', async () => {
    const assetHubDex = {
      get chain() {
        return 'AssetHubPolkadot';
      },
      getAmountOut: vi.fn().mockResolvedValue(111n),
    } as unknown as ExchangeChain;

    const localOptions = {
      ...options,
      destination: { chain: 'Moonbeam' },
    } as TTransformedOptions<
      TBuildTransactionsOptions<unknown, unknown, unknown>,
      unknown,
      unknown,
      unknown
    >;

    await getRouterFees(assetHubDex, localOptions, false);

    const buildTx = vi.mocked(getXcmFee).mock.calls[0][0].buildTx;
    await buildTx();

    const arg = vi.mocked(handleSwapExecuteTransfer).mock.calls[0][0] as {
      calculateMinAmountOut: (amountIn: bigint, assetTo?: TAssetInfo) => Promise<unknown>;
    };

    const spy = vi.spyOn(assetHubDex, 'getAmountOut');

    await arg.calculateMinAmountOut(777n);

    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        apiPjs: localOptions.exchange.apiPjs,
        amount: 777n,
        assetFrom: localOptions.exchange.assetFrom,
        assetTo: localOptions.exchange.assetTo,
        slippagePct: '1',
      }),
    );
  });

  it('throws RoutingResolutionError when getXcmFee returns NoDeal on Hydration exchange', async () => {
    const dex = {
      chain: 'AssetHubPolkadot',
      getAmountOut: vi.fn().mockResolvedValue(1234n),
    } as unknown as ExchangeChain;

    const options = {
      origin: { chain: 'Moonbeam' },
      destination: { chain: 'Moonbeam' },
      exchange: {
        chain: 'Hydration',
        apiPjs: {} as unknown,
        apiPapi: {} as unknown,
        api: {} as unknown,
        assetFrom: { symbol: 'USDC', decimals: 6 } as TAssetInfo,
        assetTo: { symbol: 'DOT', decimals: 10 } as TAssetInfo,
      },
      currencyFrom: { symbol: 'USDC' },
      currencyTo: { symbol: 'DOT' },
      amount: 1n,
      senderAddress: 'addr',
    } as unknown as TTransformedOptions<
      TBuildTransactionsOptions<unknown, unknown, unknown>,
      unknown,
      unknown,
      unknown
    >;

    vi.mocked(getXcmFee).mockResolvedValue({
      failureReason: 'NoDeal',
      hops: [],
      origin: {
        fee: 0n,
        feeType: 'dryRun',
        asset: { symbol: 'USDC', decimals: 6 } as TAssetInfo,
        currency: 'USDC',
      },
      destination: {
        fee: 0n,
        feeType: 'dryRun',
        asset: { symbol: 'DOT', decimals: 10 } as TAssetInfo,
        currency: 'DOT',
      },
    } as TGetXcmFeeResult);

    await expect(getRouterFees(dex, options, false)).rejects.toBeInstanceOf(RoutingResolutionError);
  });
});
