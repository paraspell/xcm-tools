import type { TAssetInfo } from '@paraspell/sdk';
import { dryRun, getFailureInfo, UnsupportedOperationError } from '@paraspell/sdk';
import type { ApiPromise } from '@polkadot/api';
import type { PolkadotClient } from 'polkadot-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type {
  TBuildTransactionsOptions,
  TRouterDryRunResult,
  TTransaction,
  TTransformedOptions,
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
    exchange: 'AcalaDex',
    currencyFrom: { symbol: 'ACA' },
    currencyTo: { symbol: 'AUSD' },
    amount: '1000',
    senderAddress: 'sender',
    recipientAddress: 'recipient',
    slippagePct: '0.5',
    evmSenderAddress: '0xSender',
  }) as TBuildTransactionsOptions;

const createOptions = (
  overrides: Partial<TTransformedOptions<TBuildTransactionsOptions>> = {},
): TTransformedOptions<TBuildTransactionsOptions> => ({
  ...createInitialOptions(),
  feeCalcAddress: 'sender',
  builderOptions: undefined,
  origin: undefined,
  destination: undefined,
  exchange: {
    baseChain: 'Acala',
    exchangeChain: 'AcalaDex',
    api: {} as ApiPromise,
    apiPapi: {} as PolkadotClient,
    assetFrom: acaAsset,
    assetTo: ausdAsset,
  },
  amount: 1000n,
  ...overrides,
});

const createTransaction = (chain: string): TTransaction =>
  ({
    api: {} as PolkadotClient,
    chain,
    tx: {},
    type: 'TRANSFER',
  }) as TTransaction;

const createDryRunResult = (overrides: Partial<TRouterDryRunResult> = {}): TRouterDryRunResult =>
  ({
    origin: { chain: 'Acala' },
    destination: { chain: 'Acala' },
    hops: [],
    ...overrides,
  }) as TRouterDryRunResult;

const resolvePrepareOptions = (
  options: TTransformedOptions<TBuildTransactionsOptions>,
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
        baseChain: 'Acala',
        exchangeChain: 'AcalaDex',
        api: {} as ApiPromise,
        apiPapi: {} as PolkadotClient,
        assetFrom: acaAsset,
        assetTo: ausdAsset,
      },
    });

    const routerPlan: [TTransaction] = [createTransaction('Acala')];
    const dryRunResult = createDryRunResult({
      hops: [
        { chain: 'Acala', result: {} },
        { chain: 'Moonbeam', result: {} },
      ],
    } as TRouterDryRunResult);

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
        api: {} as PolkadotClient,
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
        baseChain: 'Hydration',
        exchangeChain: 'HydrationDex',
        api: {} as ApiPromise,
        apiPapi: {} as PolkadotClient,
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
    } as TRouterDryRunResult);

    const secondResult = createDryRunResult({
      origin: {},
      destination: {},
      hops: [{ chain: 'Hydration' }],
    } as TRouterDryRunResult);

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
      UnsupportedOperationError,
    );

    expect(dryRun).not.toHaveBeenCalled();
  });
});
