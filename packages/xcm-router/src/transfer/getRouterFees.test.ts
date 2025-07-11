import type {
  TGetXcmFeeResult,
  TNodePolkadotKusama,
  TPapiTransaction,
  TXcmFeeDetail,
} from '@paraspell/sdk';
import { DryRunFailedError, getXcmFee, handleSwapExecuteTransfer } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeNode from '../dexNodes/DexNode';
import type {
  TBuildTransactionsOptionsModified,
  TDestinationInfo,
  TOriginInfo,
  TRouterXcmFeeResult,
} from '../types';
import { getSwapFee } from './fees';
import { getRouterFees } from './getRouterFees';
import { getFromExchangeFee, getToExchangeFee } from './utils';

vi.mock('./fees', () => ({
  getSwapFee: vi.fn(),
}));

vi.mock('./utils', () => ({
  getToExchangeFee: vi.fn(),
  getFromExchangeFee: vi.fn(),
}));

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    getXcmFee: vi.fn(),
    handleSwapExecuteTransfer: vi.fn(),
  };
});

describe('getRouterFees', () => {
  let dex: ExchangeNode;
  let baseNode: TNodePolkadotKusama;
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
      get node() {
        return 'SomeOtherDex';
      },
      getAmountOut: vi.fn().mockResolvedValue(5000n),
    } as unknown as ExchangeNode;
    baseNode = 'AssetHubPolkadot' as TNodePolkadotKusama;

    options = {
      exchange: {
        baseNode,
        exchangeNode: 'HydrationDex',
        api: {},
        apiPapi: {},
        assetFrom: { symbol: 'DOT' },
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
        get node() {
          return 'AssetHubPolkadot';
        },
        getAmountOut: vi.fn().mockResolvedValue(5000n),
      } as unknown as ExchangeNode;

      options.origin = { node: 'Acala', assetFrom: { symbol: 'ACA' } } as unknown as TOriginInfo;

      const result = await getRouterFees(assetHubDex, options);

      expect(result).toEqual({
        ...executeTransferResult,
        destination: {
          ...executeTransferResult.destination,
          isExchange: true,
        },
        hops: [
          {
            chain: 'AssetHubPolkadot',
            result: { fee: 50n, currency: 'DOT' },
            isExchange: true,
          },
          { chain: 'Hydration', result: { fee: 75n, currency: 'HDX' } },
        ],
      });
    });

    it('falls back to separate transactions when execute transfer fails with Filtered error', async () => {
      const assetHubDex = {
        get node() {
          return 'AssetHubPolkadot';
        },
        getAmountOut: vi.fn().mockResolvedValue(5000n),
      } as unknown as ExchangeNode;

      options.origin = { node: 'Acala' } as unknown as TOriginInfo;

      const filteredError = new DryRunFailedError('Filtered', 'origin');
      vi.mocked(handleSwapExecuteTransfer).mockRejectedValue(filteredError);

      const result = await getRouterFees(assetHubDex, options);

      expect(getSwapFee).toHaveBeenCalled();
      expect(result.hops).toHaveLength(1);
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
      options.origin = { node: 'Acala', amount: 1000n } as unknown as TOriginInfo;

      const result = await getRouterFees(dex, options);

      expect(result.hops).toEqual([...toExchangeFeeValue.hops]);
      expect(result.origin).toEqual(toExchangeFeeValue.origin);
      expect(result.destination).toEqual({ ...swapFee, isExchange: true });
    });

    it('adds exchange to hops only when destination exists but origin undefined', async () => {
      options.destination = { node: 'Moonbeam', min: 0n } as unknown as TDestinationInfo;

      const result = await getRouterFees(dex, options);

      expect(result.hops).toEqual([...toDestFeeValue.hops]);
      expect(result.origin).toEqual({ ...swapFee, isExchange: true });
      expect(result.destination).toEqual(toDestFeeValue.destination);
    });

    it('handles both origin and destination - exchange added to hops', async () => {
      options.origin = { node: 'Acala' } as unknown as TOriginInfo;
      options.destination = { node: 'Moonbeam' } as unknown as TDestinationInfo;

      const result = await getRouterFees(dex, options);

      expect(result).toEqual<TRouterXcmFeeResult>({
        failureReason: undefined,
        failureChain: undefined,
        origin: toExchangeFeeValue.origin,
        destination: toDestFeeValue.destination,
        hops: [
          ...toExchangeFeeValue.hops,
          {
            chain: baseNode,
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
      options.origin = { node: 'Acala' } as unknown as TOriginInfo;
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
});
