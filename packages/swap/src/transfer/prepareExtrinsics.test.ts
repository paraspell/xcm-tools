import type { TPapiApi } from '@paraspell/sdk';
import type { PolkadotApi, TAssetInfo } from '@paraspell/sdk-core';
import { handleSwapExecuteTransfer } from '@paraspell/sdk-core';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type {
  TBuildTransactionsOptions,
  TDestinationInfo,
  TOriginInfo,
  TTransformedOptions,
} from '../types';
import * as createSwapTxModule from './createSwapTx';
import { prepareExtrinsics } from './prepareExtrinsics';
import * as utils from './utils';

vi.mock('./utils');
vi.mock('./createSwapTx');

vi.mock('@paraspell/sdk-core', async (importActual) => ({
  ...(await importActual()),
  handleSwapExecuteTransfer: vi.fn(),
}));

const mockApi = {} as PolkadotApi<unknown, unknown, unknown>;

const originApi = {} as TPapiApi;
const dexChain = { chain: 'Acala' } as ExchangeChain;

const baseOptions = {
  origin: {
    api: originApi,
    chain: 'BifrostPolkadot',
  },
  exchange: {
    chain: 'Acala',
  },
  destination: {
    address: 'dest',
    chain: 'Crust',
  },
  api: mockApi,
} as TTransformedOptions<
  TBuildTransactionsOptions<unknown, unknown, unknown>,
  unknown,
  unknown,
  unknown
>;

describe('prepareExtrinsics', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(createSwapTxModule.createSwapTx).mockResolvedValue({
      txs: ['swapTx'],
      amountOut: 1000n,
    });
  });

  test('returns only swap extrinsic when origin & destination match exchange', async () => {
    const res = await prepareExtrinsics(dexChain, {
      ...baseOptions,
      origin: { ...baseOptions.origin, chain: 'Acala' } as TOriginInfo<unknown>,
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
    vi.mocked(utils.buildToExchangeExtrinsic).mockResolvedValue('toExchangeTx');

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
    vi.mocked(utils.buildFromExchangeExtrinsic).mockResolvedValue('toDestTx');

    const res = await prepareExtrinsics(dexChain, {
      ...baseOptions,
      origin: { ...baseOptions.origin, chain: 'Acala' } as TOriginInfo<unknown>,
    });

    expect(res).toEqual({
      toExchangeTx: undefined,
      swapTxs: ['swapTx'],
      toDestTx: 'toDestTx',
      amountOut: 1000n,
    });

    expect(utils.buildFromExchangeExtrinsic).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1000n }),
    );
  });

  test('creates all three extrinsics when both origin & destination differ', async () => {
    vi.mocked(utils.buildToExchangeExtrinsic).mockResolvedValue('toExchangeTx');
    vi.mocked(utils.buildFromExchangeExtrinsic).mockResolvedValue('toDestTx');

    const res = await prepareExtrinsics(dexChain, baseOptions);

    expect(res).toEqual({
      toExchangeTx: 'toExchangeTx',
      swapTxs: ['swapTx'],
      toDestTx: 'toDestTx',
      amountOut: 1000n,
    });
  });

  test('handles AssetHub/Hydration special case with handleSwapExecuteTransfer', async () => {
    vi.mocked(handleSwapExecuteTransfer).mockResolvedValue('handleSwapExecuteTransferTx');

    const assetHubDexChain = {
      chain: 'AssetHubPolkadot',
      getAmountOut: vi.fn().mockReturnValue(500n),
    } as unknown as ExchangeChain;

    const optionsWithAssetHub = {
      ...baseOptions,
      amount: 100n,
      sender: 'sender123',
      recipient: 'recipient456',
      exchange: {
        ...baseOptions.exchange,
        chain: 'AssetHubPolkadot',
        assetFrom: { symbol: 'DOT' },
        assetTo: { symbol: 'USDT' },
        apiPapi: {} as TPapiApi,
        api: {} as PolkadotApi<unknown, unknown, unknown>,
      },
    } as TTransformedOptions<
      TBuildTransactionsOptions<unknown, unknown, unknown>,
      unknown,
      unknown,
      unknown
    >;

    const res = await prepareExtrinsics(assetHubDexChain, optionsWithAssetHub);

    expect(res).toEqual({
      swapTxs: ['handleSwapExecuteTransferTx'],
      amountOut: 500n,
      isExecute: true,
    });

    expect(handleSwapExecuteTransfer).toHaveBeenCalledWith({
      api: mockApi,
      chain: optionsWithAssetHub.origin?.chain,
      exchangeChain: optionsWithAssetHub.exchange.chain,
      destChain: optionsWithAssetHub.destination?.chain,
      assetInfoFrom: {
        ...optionsWithAssetHub.exchange.assetFrom,
        amount: BigInt(optionsWithAssetHub.amount),
      },
      assetInfoTo: {
        ...optionsWithAssetHub.exchange.assetTo,
        amount: 500n,
      },
      currencyTo: undefined,
      feeAssetInfo: undefined,
      sender: optionsWithAssetHub.sender,
      recipient: optionsWithAssetHub.recipient,
      calculateMinAmountOut: expect.any(Function),
    });
  });

  test('throws error when handleSwapExecuteTransfer fails with non-DryRunFailedError', async () => {
    const assetHubDexChain = {
      chain: 'AssetHubPolkadot',
      getAmountOut: vi.fn().mockReturnValue(500n),
    } as unknown as ExchangeChain;

    const optionsWithAssetHub = {
      ...baseOptions,
      amount: 100n,
      sender: 'sender123',
      recipient: 'recipient456',
      exchange: {
        ...baseOptions.exchange,
        chain: 'AssetHubPolkadot',
        assetFrom: { symbol: 'DOT' },
        assetTo: { symbol: 'USDT' },
        apiPapi: {} as TPapiApi,
        api: {} as PolkadotApi<unknown, unknown, unknown>,
      },
    } as TTransformedOptions<
      TBuildTransactionsOptions<unknown, unknown, unknown>,
      unknown,
      unknown,
      unknown
    >;

    const customError = new Error('Network error');
    vi.mocked(handleSwapExecuteTransfer).mockRejectedValue(customError);

    await expect(prepareExtrinsics(assetHubDexChain, optionsWithAssetHub)).rejects.toThrow(
      'Network error',
    );
  });

  test('falls back to default swap execution and tests calculateMinAmountOut function', async () => {
    const { DryRunFailedError } = await import('@paraspell/sdk-core');

    const assetHubDexChain = {
      chain: 'AssetHubPolkadot',
      getAmountOut: vi.fn().mockReturnValueOnce(500n).mockReturnValue(250n),
    } as unknown as ExchangeChain;

    const optionsWithAssetHub = {
      ...baseOptions,
      amount: 100n,
      sender: 'sender123',
      recipient: 'recipient456',
      exchange: {
        ...baseOptions.exchange,
        chain: 'AssetHubPolkadot',
        assetFrom: { symbol: 'DOT' },
        assetTo: { symbol: 'USDT' },
        apiPapi: {} as TPapiApi,
        api: {} as PolkadotApi<unknown, unknown, unknown>,
      },
    } as TTransformedOptions<
      TBuildTransactionsOptions<unknown, unknown, unknown>,
      unknown,
      unknown,
      unknown
    >;

    let capturedCalculateMinAmountOut:
      | ((amountIn: bigint, assetTo?: TAssetInfo) => Promise<bigint>)
      | undefined;

    vi.mocked(handleSwapExecuteTransfer).mockImplementation((params) => {
      capturedCalculateMinAmountOut = params.calculateMinAmountOut;
      throw new DryRunFailedError('Filtered', 'origin');
    });

    vi.mocked(utils.buildToExchangeExtrinsic).mockResolvedValue('toExchangeTx');
    vi.mocked(utils.buildFromExchangeExtrinsic).mockResolvedValue('toDestTx');

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
