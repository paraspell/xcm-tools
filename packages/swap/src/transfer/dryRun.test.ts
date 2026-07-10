import type { PolkadotApi, TAssetInfo, TDryRunResult } from '@paraspell/sdk-core';
import { dryRun, getDryRunError, UnsupportedOperationError } from '@paraspell/sdk-core';
import type { ApiPromise } from '@polkadot/api';
import type { PolkadotClient } from 'polkadot-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransaction, TTransformedOptions } from '../types';

const mockApi = { clone: () => mockApi } as unknown as PolkadotApi<unknown, unknown, unknown>;
import { buildTransactions } from './buildTransactions';
import { dryRunRouter, dryRunRouterPreview, dryRunTransactions } from './dryRun';
import { prepareTransformedOptions, validateTransferOptions } from './utils';

vi.mock('@paraspell/sdk-core', async () => {
  const actual = await vi.importActual('@paraspell/sdk-core');
  return {
    ...actual,
    dryRun: vi.fn(),
    getDryRunError: vi.fn(),
  };
});

vi.mock('./utils');
vi.mock('./buildTransactions');

const acaAsset: TAssetInfo = {
  symbol: 'ACA',
  decimals: 12,
  assetId: '1',
  location: { parents: 0, interior: 'Here' },
};

const ausdAsset: TAssetInfo = {
  symbol: 'AUSD',
  decimals: 12,
  assetId: '2',
  location: {
    parents: 1,
    interior: {
      X1: [{ Parachain: 2000 }],
    },
  },
};

const createInitialOptions = () =>
  ({
    from: 'Acala',
    to: 'Acala',
    exchange: 'Acala',
    currencyFrom: { symbol: 'ACA' },
    currencyTo: { symbol: 'AUSD' },
    amount: '1000',
    sender: 'sender',
    recipient: 'recipient',
    slippagePct: '0.5',
    evmSenderAddress: '0xSender',
  }) as TBuildTransactionsOptions<unknown, unknown, unknown>;

const createOptions = (
  overrides: Partial<
    TTransformedOptions<
      TBuildTransactionsOptions<unknown, unknown, unknown>,
      unknown,
      unknown,
      unknown
    >
  > = {},
): TTransformedOptions<
  TBuildTransactionsOptions<unknown, unknown, unknown>,
  unknown,
  unknown,
  unknown
> => ({
  ...createInitialOptions(),
  feeCalcAddress: 'sender',
  origin: undefined,
  destination: undefined,
  exchange: {
    apiType: 'PJS' as const,
    chain: 'Acala',
    apiPjs: {} as ApiPromise,
    api: {} as PolkadotApi<unknown, unknown, unknown>,
    assetFrom: acaAsset,
    assetTo: ausdAsset,
  },
  amount: 1000n,
  api: mockApi,
  ...overrides,
});

const createTransaction = (chain: string): TTransaction<unknown, unknown> =>
  ({
    api: {},
    chain,
    tx: {},
    type: 'TRANSFER',
  }) as TTransaction<unknown, unknown>;

const createDryRunResult = (overrides: Partial<TDryRunResult> = {}): TDryRunResult =>
  ({
    success: true,
    origin: { chain: 'Acala' },
    destination: { chain: 'Acala' },
    hops: [],
    ...overrides,
  }) as TDryRunResult;

const resolvePrepareOptions = (
  options: TTransformedOptions<
    TBuildTransactionsOptions<unknown, unknown, unknown>,
    unknown,
    unknown,
    unknown
  >,
  dexChain: string,
) =>
  vi.mocked(prepareTransformedOptions).mockResolvedValue({
    dex: { chain: dexChain } as ExchangeChain,
    options,
  });

describe('dryRunRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('flags exchange legs when origin or destination are handled by the exchange chain', async () => {
    const transformedOptions = createOptions({
      origin: undefined,
      destination: undefined,
      exchange: {
        apiType: 'PJS' as const,
        chain: 'Acala',
        apiPjs: {} as ApiPromise,
        api: {} as PolkadotApi<unknown, unknown, unknown>,
        assetFrom: acaAsset,
        assetTo: ausdAsset,
      },
    });

    const routerPlan: [TTransaction<unknown, unknown>] = [createTransaction('Acala')];
    const dryRunResult = createDryRunResult({
      hops: [
        { chain: 'Acala', result: {} },
        { chain: 'Moonbeam', result: {} },
      ],
    } as TDryRunResult);

    resolvePrepareOptions(transformedOptions, 'Acala');
    vi.mocked(buildTransactions).mockResolvedValue(routerPlan);
    vi.mocked(dryRun).mockResolvedValue(dryRunResult);

    const initialOptions = createInitialOptions();
    const result = await dryRunRouter({ ...initialOptions, api: mockApi });

    expect(validateTransferOptions).toHaveBeenCalledWith({ ...initialOptions, api: mockApi });
    expect(dryRun).toHaveBeenCalledTimes(1);
    expect(dryRun).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: 'Acala',
        sender: '0xSender',
        currency: expect.objectContaining({ amount: 1000n }),
      }),
    );
    expect(result.origin.isExchange).toBe(true);
    expect(result.destination?.isExchange).toBe(true);
    expect(result.hops.find((hop) => hop.chain === 'Acala')?.result.isExchange).toBe(true);
    expect(result.hops.find((hop) => hop.chain === 'Moonbeam')?.result.isExchange).toBeFalsy();
  });

  it('propagates bypass options to the second transaction when the first dry run succeeds', async () => {
    const transformedOptions = createOptions({
      origin: {
        api: {},
        chain: 'BifrostPolkadot',
        assetFrom: {
          symbol: 'BNC',
          decimals: 12,
          location: { parents: 0, interior: 'Here' },
        },
      },
      destination: {
        chain: 'Moonbeam',
        address: 'dest-address',
      },
      exchange: {
        apiType: 'PAPI' as const,
        chain: 'Hydration',
        apiPapi: {} as PolkadotClient,
        api: {} as PolkadotApi<unknown, unknown, unknown>,
        assetFrom: ausdAsset,
        assetTo: acaAsset,
      },
    });

    resolvePrepareOptions(transformedOptions, 'Hydration');

    vi.mocked(buildTransactions).mockResolvedValue([
      createTransaction('BifrostPolkadot'),
      createTransaction('Hydration'),
    ]);

    const firstResult = createDryRunResult({
      origin: {},
      destination: {},
      hops: [{ chain: 'BifrostPolkadot' }],
    } as TDryRunResult);

    const secondResult = createDryRunResult({
      origin: {},
      destination: {},
      hops: [{ chain: 'Hydration' }],
    } as TDryRunResult);

    vi.mocked(dryRun).mockResolvedValueOnce(firstResult).mockResolvedValueOnce(secondResult);

    vi.mocked(getDryRunError).mockReturnValueOnce(undefined).mockReturnValueOnce(undefined);

    await dryRunRouter({ ...createInitialOptions(), api: mockApi });

    expect(dryRun).toHaveBeenCalledTimes(2);

    const firstCallArgs = vi.mocked(dryRun).mock.calls[0][0];
    const secondCallArgs = vi.mocked(dryRun).mock.calls[1][0];

    expect(firstCallArgs.destination).toBe('Hydration');
    expect(firstCallArgs.bypassOptions).toBeUndefined();

    expect(secondCallArgs.destination).toBe('Moonbeam');
    expect(secondCallArgs.bypassOptions).toEqual({
      mintFeeAssets: false,
      sentAssetMintMode: 'preview',
    });
  });

  it('throws when the router plan contains more than two transactions', async () => {
    resolvePrepareOptions(createOptions(), 'Acala');

    vi.mocked(buildTransactions).mockResolvedValue([
      createTransaction('Acala'),
      createTransaction('Moonbeam'),
      createTransaction('Astar'),
    ]);

    await expect(dryRunRouter({ ...createInitialOptions(), api: mockApi })).rejects.toBeInstanceOf(
      UnsupportedOperationError,
    );

    expect(dryRun).not.toHaveBeenCalled();
  });
});

describe('dryRunRouterPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes preview bypass options to the single transaction', async () => {
    const transformedOptions = createOptions();

    resolvePrepareOptions(transformedOptions, 'Acala');
    vi.mocked(buildTransactions).mockResolvedValue([createTransaction('Acala')]);
    vi.mocked(dryRun).mockResolvedValue(createDryRunResult());

    await dryRunRouterPreview({ ...createInitialOptions(), api: mockApi }, { mintFeeAssets: true });

    expect(dryRun).toHaveBeenCalledTimes(1);
    expect(dryRun).toHaveBeenCalledWith(
      expect.objectContaining({
        bypassOptions: { sentAssetMintMode: 'preview', mintFeeAssets: true },
      }),
    );
  });

  it('mints on origin and exchange in two-transaction flows', async () => {
    const transformedOptions = createOptions({
      origin: {
        api: {},
        chain: 'BifrostPolkadot',
        assetFrom: {
          symbol: 'BNC',
          decimals: 12,
          location: { parents: 0, interior: 'Here' },
        },
      },
      destination: { chain: 'Moonbeam', address: 'dest-address' },
      exchange: {
        apiType: 'PAPI' as const,
        chain: 'Hydration',
        apiPapi: {} as PolkadotClient,
        api: {} as PolkadotApi<unknown, unknown, unknown>,
        assetFrom: ausdAsset,
        assetTo: acaAsset,
      },
    });

    resolvePrepareOptions(transformedOptions, 'Hydration');

    vi.mocked(buildTransactions).mockResolvedValue([
      createTransaction('BifrostPolkadot'),
      createTransaction('Hydration'),
    ]);

    vi.mocked(dryRun)
      .mockResolvedValueOnce(createDryRunResult())
      .mockResolvedValueOnce(createDryRunResult());

    vi.mocked(getDryRunError).mockReturnValueOnce(undefined).mockReturnValueOnce(undefined);

    await dryRunRouterPreview({ ...createInitialOptions(), api: mockApi }, { mintFeeAssets: true });

    expect(dryRun).toHaveBeenCalledTimes(2);

    const [firstCall, secondCall] = vi.mocked(dryRun).mock.calls;

    expect(firstCall[0].bypassOptions).toEqual({
      sentAssetMintMode: 'preview',
      mintFeeAssets: true,
    });
    expect(secondCall[0].bypassOptions).toEqual({
      sentAssetMintMode: 'preview',
      mintFeeAssets: true,
    });
  });

  it('defaults mintFeeAssets to undefined when no preview options provided', async () => {
    const transformedOptions = createOptions();

    resolvePrepareOptions(transformedOptions, 'Acala');
    vi.mocked(buildTransactions).mockResolvedValue([createTransaction('Acala')]);
    vi.mocked(dryRun).mockResolvedValue(createDryRunResult());

    await dryRunRouterPreview({ ...createInitialOptions(), api: mockApi });

    expect(dryRun).toHaveBeenCalledWith(
      expect.objectContaining({
        bypassOptions: { sentAssetMintMode: 'preview', mintFeeAssets: undefined },
      }),
    );
  });
});

describe('dryRunTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the override for the exchange leg instead of recomputing it', async () => {
    const transformedOptions = createOptions({
      origin: {
        api: {},
        chain: 'BifrostPolkadot',
        assetFrom: { symbol: 'BNC', decimals: 12, location: { parents: 0, interior: 'Here' } },
      },
      destination: { chain: 'Moonbeam', address: 'dest-address' },
      exchange: {
        apiType: 'PAPI' as const,
        chain: 'Hydration',
        apiPapi: {} as PolkadotClient,
        api: {} as PolkadotApi<unknown, unknown, unknown>,
        assetFrom: ausdAsset,
        assetTo: acaAsset,
      },
    });

    vi.mocked(dryRun)
      .mockResolvedValueOnce(createDryRunResult())
      .mockResolvedValueOnce(createDryRunResult());

    vi.mocked(getDryRunError).mockReturnValueOnce(undefined).mockReturnValueOnce(undefined);

    await dryRunTransactions(
      [createTransaction('BifrostPolkadot'), createTransaction('Hydration')],
      transformedOptions,
      { sentAssetMintMode: 'bypass' },
      { sentAssetMintMode: 'bypass' },
    );

    expect(dryRun).toHaveBeenCalledTimes(2);

    const [firstCall, secondCall] = vi.mocked(dryRun).mock.calls;
    expect(firstCall[0].bypassOptions).toEqual({ sentAssetMintMode: 'bypass' });
    expect(secondCall[0].bypassOptions).toEqual({ sentAssetMintMode: 'bypass' });
  });
});
