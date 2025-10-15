import { dryRun, getFailureInfo, InvalidParameterError } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  TBuildTransactionsOptions,
  TBuildTransactionsOptionsModified,
  TRouterDryRunResult,
  TTransaction,
} from '../types';
import { buildTransactions } from './buildTransactions';
import { dryRunRouter } from './dryRun';
import { prepareTransformedOptions, validateTransferOptions } from './utils';

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    dryRun: vi.fn(),
    getFailureInfo: vi.fn(),
  };
});

vi.mock('./utils');
vi.mock('./buildTransactions');

const createInitialOptions = (): TBuildTransactionsOptions =>
  ({
    from: 'Acala',
    to: 'Acala',
    exchange: 'AcalaDex' as never,
    currencyFrom: { symbol: 'ACA' } as never,
    currencyTo: { symbol: 'AUSD' } as never,
    amount: '1000',
    senderAddress: 'sender',
    recipientAddress: 'recipient',
    slippagePct: '0.5',
    evmSenderAddress: '0xSender',
  }) as TBuildTransactionsOptions;

const createOptions = (
  overrides: Partial<TBuildTransactionsOptionsModified> = {},
): TBuildTransactionsOptionsModified =>
  ({
    ...createInitialOptions(),
    feeCalcAddress: 'sender',
    builderOptions: undefined,
    origin: undefined,
    destination: undefined,
    exchange: {
      baseChain: 'Acala',
      exchangeChain: 'AcalaDex',
      api: {} as never,
      apiPapi: {} as never,
      assetFrom: { symbol: 'ACA', decimals: 12 } as never,
      assetTo: { symbol: 'AUSD', decimals: 12 } as never,
    },
    ...overrides,
  }) as unknown as TBuildTransactionsOptionsModified;

const createTransaction = (chain: string): TTransaction =>
  ({
    api: {} as never,
    chain: chain as never,
    tx: {} as never,
    type: 'TRANSFER',
  }) as TTransaction;

const createDryRunResult = (overrides: Partial<TRouterDryRunResult> = {}): TRouterDryRunResult =>
  ({
    origin: { chain: 'Acala' } as never,
    destination: { chain: 'Acala' } as never,
    hops: [],
    ...overrides,
  }) as TRouterDryRunResult;

const resolvePrepareOptions = (options: TBuildTransactionsOptionsModified, dexChain: string) =>
  vi.mocked(prepareTransformedOptions).mockResolvedValue({
    dex: { chain: dexChain } as never,
    options: options as never,
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
        baseChain: 'Acala',
        exchangeChain: 'AcalaDex',
        api: {} as never,
        apiPapi: {} as never,
        assetFrom: { symbol: 'ACA', decimals: 12 },
        assetTo: { symbol: 'AUSD', decimals: 12 },
      },
    });

    const routerPlan: [TTransaction] = [createTransaction('Acala')];
    const dryRunResult = createDryRunResult({
      hops: [{ chain: 'Acala' } as never, { chain: 'Moonbeam' } as never],
    });

    resolvePrepareOptions(transformedOptions, 'Acala');
    vi.mocked(buildTransactions).mockResolvedValue(routerPlan);
    vi.mocked(dryRun).mockResolvedValue(dryRunResult);

    const initialOptions = createInitialOptions();
    const result = await dryRunRouter(initialOptions);

    expect(validateTransferOptions).toHaveBeenCalledWith(initialOptions);
    expect(dryRun).toHaveBeenCalledTimes(1);
    expect(dryRun).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: 'Acala',
        senderAddress: '0xSender',
        address: 'recipient',
        currency: expect.objectContaining({ amount: 1000n }),
      }),
    );
    expect(result.origin.isExchange).toBe(true);
    expect(result.destination?.isExchange).toBe(true);
    expect(result.hops.find((hop) => hop.chain === 'Acala')?.isExchange).toBe(true);
    expect(result.hops.find((hop) => hop.chain === 'Moonbeam')?.isExchange).toBeFalsy();
  });

  it('propagates bypass options to the second transaction when the first dry run succeeds', async () => {
    const transformedOptions = createOptions({
      origin: {
        api: {} as never,
        chain: 'BifrostPolkadot',
        assetFrom: {
          symbol: 'BNC',
          decimals: 12,
          location: { parents: 0, interior: 'Here' },
        } as never,
      },
      destination: {
        chain: 'Moonbeam',
        address: 'dest-address',
      },
      exchange: {
        baseChain: 'Hydration',
        exchangeChain: 'HydrationDex',
        api: {} as never,
        apiPapi: {} as never,
        assetFrom: { symbol: 'BNC', decimals: 12 } as never,
        assetTo: { symbol: 'GLMR', decimals: 18 } as never,
      },
    });

    resolvePrepareOptions(transformedOptions, 'Hydration');

    vi.mocked(buildTransactions).mockResolvedValue([
      createTransaction('BifrostPolkadot'),
      createTransaction('Hydration'),
    ]);

    const firstResult = createDryRunResult({
      origin: { chain: 'BifrostPolkadot' } as never,
      destination: { chain: 'Hydration' } as never,
      hops: [{ chain: 'BifrostPolkadot' } as never],
    });

    const secondResult = createDryRunResult({
      origin: { chain: 'Hydration' } as never,
      destination: { chain: 'Moonbeam' } as never,
      hops: [{ chain: 'Hydration' } as never],
    });

    vi.mocked(dryRun).mockResolvedValueOnce(firstResult).mockResolvedValueOnce(secondResult);

    vi.mocked(getFailureInfo)
      .mockReturnValueOnce({ failureReason: undefined })
      .mockReturnValueOnce({ failureReason: undefined });

    await dryRunRouter(createInitialOptions());

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

    await expect(dryRunRouter(createInitialOptions())).rejects.toBeInstanceOf(
      InvalidParameterError,
    );

    expect(dryRun).not.toHaveBeenCalled();
  });
});
