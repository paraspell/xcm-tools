import type { TAssetInfo } from '@paraspell/sdk';
import { handleSwapExecuteTransfer, type TPapiApi, type TPapiTransaction } from '@paraspell/sdk';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptionsModified, TDestinationInfo, TOriginInfo } from '../types';
import * as createSwapTxModule from './createSwapTx';
import { prepareExtrinsics } from './prepareExtrinsics';
import * as utils from './utils';

vi.mock('./utils');

vi.mock('./createSwapTx');

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    handleSwapExecuteTransfer: vi.fn(),
  };
});

const originApi = {} as TPapiApi;
const dexChain = { chain: 'Acala' } as ExchangeChain;

const baseOptions = {
  origin: {
    api: originApi,
    chain: 'BifrostPolkadot',
  },
  exchange: {
    baseChain: 'Acala',
  },
  destination: {
    address: 'dest',
    chain: 'Crust',
  },
} as unknown as TBuildTransactionsOptionsModified;

describe('prepareExtrinsics', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(createSwapTxModule.createSwapTx).mockResolvedValue({
      txs: ['swapTx' as unknown as TPapiTransaction],
      amountOut: '1000',
    });
  });

  test('returns only swap extrinsic when origin & destination match exchange', async () => {
    const res = await prepareExtrinsics(dexChain, {
      ...baseOptions,
      origin: { ...baseOptions.origin, chain: 'Acala' } as TOriginInfo,
      destination: { ...baseOptions.destination, chain: 'Acala' } as TDestinationInfo,
    });

    expect(res).toEqual({
      toExchangeTx: undefined,
      swapTxs: ['swapTx'],
      toDestTx: undefined,
      amountOut: 1000n,
    });

    expect(utils.buildToExchangeExtrinsic).not.toHaveBeenCalled();
    expect(utils.buildFromExchangeExtrinsic).not.toHaveBeenCalled();
    expect(createSwapTxModule.createSwapTx).toHaveBeenCalledWith(dexChain, expect.any(Object));
  });

  test('creates transfer-to-exchange when origin differs', async () => {
    vi.mocked(utils.buildToExchangeExtrinsic).mockResolvedValue(
      'toExchangeTx' as unknown as TPapiTransaction,
    );

    const res = await prepareExtrinsics(dexChain, {
      ...baseOptions,
      destination: { ...baseOptions.destination, chain: 'Acala' } as TDestinationInfo,
    });

    expect(res).toEqual({
      toExchangeTx: 'toExchangeTx',
      swapTxs: ['swapTx'],
      toDestTx: undefined,
      amountOut: 1000n,
    });

    expect(utils.buildToExchangeExtrinsic).toHaveBeenCalledWith(
      expect.objectContaining({ origin: baseOptions.origin }),
    );
  });

  test('creates transfer-from-exchange when destination differs', async () => {
    vi.mocked(utils.buildFromExchangeExtrinsic).mockResolvedValue(
      'toDestTx' as unknown as TPapiTransaction,
    );

    const res = await prepareExtrinsics(dexChain, {
      ...baseOptions,
      origin: { ...baseOptions.origin, chain: 'Acala' } as TOriginInfo,
    });

    expect(res).toEqual({
      toExchangeTx: undefined,
      swapTxs: ['swapTx'],
      toDestTx: 'toDestTx',
      amountOut: 1000n,
    });

    expect(utils.buildFromExchangeExtrinsic).toHaveBeenCalledWith(
      expect.objectContaining({ amount: '1000' }),
    );
  });

  test('creates all three extrinsics when both origin & destination differ', async () => {
    vi.mocked(utils.buildToExchangeExtrinsic).mockResolvedValue(
      'toExchangeTx' as unknown as TPapiTransaction,
    );
    vi.mocked(utils.buildFromExchangeExtrinsic).mockResolvedValue(
      'toDestTx' as unknown as TPapiTransaction,
    );

    const res = await prepareExtrinsics(dexChain, baseOptions);

    expect(res).toEqual({
      toExchangeTx: 'toExchangeTx',
      swapTxs: ['swapTx'],
      toDestTx: 'toDestTx',
      amountOut: 1000n,
    });
  });

  test('handles AssetHub/Hydration special case with handleSwapExecuteTransfer', async () => {
    vi.mocked(handleSwapExecuteTransfer).mockResolvedValue(
      'handleSwapExecuteTransferTx' as unknown as TPapiTransaction,
    );

    const assetHubDexChain = {
      chain: 'AssetHubPolkadot',
      getAmountOut: vi.fn().mockReturnValue(500n),
    } as unknown as ExchangeChain;

    const optionsWithAssetHub = {
      ...baseOptions,
      amount: '100',
      senderAddress: 'sender123',
      recipientAddress: 'recipient456',
      exchange: {
        ...baseOptions.exchange,
        baseChain: 'AssetHubPolkadot',
        assetFrom: { symbol: 'DOT' },
        assetTo: { symbol: 'USDT' },
        apiPapi: {} as TPapiApi,
      },
    } as TBuildTransactionsOptionsModified;

    const res = await prepareExtrinsics(assetHubDexChain, optionsWithAssetHub);

    expect(res).toEqual({
      swapTxs: ['handleSwapExecuteTransferTx'],
      amountOut: 500n,
      isExecute: true,
    });

    expect(handleSwapExecuteTransfer).toHaveBeenCalledWith(
      {
        chain: optionsWithAssetHub.origin?.chain,
        exchangeChain: optionsWithAssetHub.exchange.baseChain,
        destChain: optionsWithAssetHub.destination?.chain,
        assetInfoFrom: {
          ...optionsWithAssetHub.exchange.assetFrom,
          amount: BigInt(optionsWithAssetHub.amount),
        },
        assetInfoTo: {
          ...optionsWithAssetHub.exchange.assetTo,
          amount: 500n,
        },
        senderAddress: optionsWithAssetHub.senderAddress,
        recipientAddress: optionsWithAssetHub.recipientAddress,
        calculateMinAmountOut: expect.any(Function),
      },
      undefined,
    );
  });

  test('throws error when handleSwapExecuteTransfer fails with non-DryRunFailedError', async () => {
    const assetHubDexChain = {
      chain: 'AssetHubPolkadot',
      getAmountOut: vi.fn().mockReturnValue(500n),
    } as unknown as ExchangeChain;

    const optionsWithAssetHub = {
      ...baseOptions,
      amount: '100',
      senderAddress: 'sender123',
      recipientAddress: 'recipient456',
      exchange: {
        ...baseOptions.exchange,
        baseChain: 'AssetHubPolkadot',
        assetFrom: { symbol: 'DOT' },
        assetTo: { symbol: 'USDT' },
        apiPapi: {} as TPapiApi,
      },
    } as TBuildTransactionsOptionsModified;

    const customError = new Error('Network error');
    vi.mocked(handleSwapExecuteTransfer).mockRejectedValue(customError);

    await expect(prepareExtrinsics(assetHubDexChain, optionsWithAssetHub)).rejects.toThrow(
      'Network error',
    );
  });

  test('falls back to default swap execution and tests calculateMinAmountOut function', async () => {
    const { DryRunFailedError } = await import('@paraspell/sdk');

    const assetHubDexChain = {
      chain: 'AssetHubPolkadot',
      getAmountOut: vi.fn().mockReturnValueOnce(500n).mockReturnValue(250n),
    } as unknown as ExchangeChain;

    const optionsWithAssetHub = {
      ...baseOptions,
      amount: '100',
      senderAddress: 'sender123',
      recipientAddress: 'recipient456',
      exchange: {
        ...baseOptions.exchange,
        baseChain: 'AssetHubPolkadot',
        assetFrom: { symbol: 'DOT' },
        assetTo: { symbol: 'USDT' },
        apiPapi: {} as TPapiApi,
      },
    } as TBuildTransactionsOptionsModified;

    let capturedCalculateMinAmountOut:
      | ((amountIn: bigint, assetTo?: TAssetInfo) => Promise<bigint>)
      | undefined;

    vi.mocked(handleSwapExecuteTransfer).mockImplementation((params) => {
      capturedCalculateMinAmountOut = params.calculateMinAmountOut;
      throw new DryRunFailedError('Filtered', 'origin');
    });

    vi.mocked(utils.buildToExchangeExtrinsic).mockResolvedValue(
      'toExchangeTx' as unknown as TPapiTransaction,
    );
    vi.mocked(utils.buildFromExchangeExtrinsic).mockResolvedValue(
      'toDestTx' as unknown as TPapiTransaction,
    );

    const res = await prepareExtrinsics(assetHubDexChain, optionsWithAssetHub);

    expect(res).toEqual({
      toExchangeTx: 'toExchangeTx',
      swapTxs: ['swapTx'],
      toDestTx: 'toDestTx',
      amountOut: 1000n,
    });
    expect(createSwapTxModule.createSwapTx).toHaveBeenCalledWith(
      assetHubDexChain,
      expect.any(Object),
    );

    expect(capturedCalculateMinAmountOut).toBeDefined();
    if (capturedCalculateMinAmountOut) {
      const testAsset = { symbol: 'USDC' } as TAssetInfo;
      const result1 = await capturedCalculateMinAmountOut(200n, testAsset);
      expect(result1).toBe(250n);

      const result2 = await capturedCalculateMinAmountOut(150n);
      expect(result2).toBe(250n);
    }
  });
});
