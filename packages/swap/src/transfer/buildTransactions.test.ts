import type { TPapiApi } from '@paraspell/sdk';
import type { PolkadotApi } from '@paraspell/sdk-core';
import type { TPjsApi } from '@paraspell/sdk-pjs';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type {
  TBuildTransactionsOptions,
  TDestinationInfo,
  TOriginInfo,
  TTransformedOptions,
} from '../types';
import { buildTransactions } from './buildTransactions';
import * as prepareExtrinsicsModule from './prepareExtrinsics';

const mockCallBatchMethod = vi.fn().mockReturnValue('batchTx');
const mockApi = {} as unknown as PolkadotApi<unknown, unknown, unknown>;

const originApi = {} as TPapiApi;
const swapApi = {} as TPjsApi;

const swapApiPapi = {
  getUnsafeApi: () => ({
    tx: {
      Utility: {
        batch_all: vi.fn().mockReturnValue('batchTx'),
      },
    },
  }),
} as unknown as TPapiApi;

vi.mock('./prepareExtrinsics');

const exchangeApi = {
  api: swapApiPapi,
  callBatchMethod: mockCallBatchMethod,
} as unknown as PolkadotApi<unknown, unknown, unknown>;

const baseOptions = {
  origin: {
    api: originApi,
    chain: 'BifrostPolkadot',
    assetFrom: { symbol: 'ACA' },
  },
  exchange: {
    chain: 'Acala',
    apiPjs: swapApi,
    apiPapi: swapApiPapi,
    api: exchangeApi,
  },
  destination: {
    address: 'someAddress',
    chain: 'Crust',
  },
  api: mockApi,
} as TTransformedOptions<
  TBuildTransactionsOptions<unknown, unknown, unknown>,
  unknown,
  unknown,
  unknown
>;

describe('buildTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(prepareExtrinsicsModule.prepareExtrinsics).mockResolvedValue({
      toExchangeTx: undefined,
      swapTxs: ['swapTx'],
      toDestTx: undefined,
      amountOut: 1000n,
    });
  });

  test('returns only swap tx when origin & destination are the exchange chain', async () => {
    const res = await buildTransactions({ chain: 'Acala' } as ExchangeChain, {
      ...baseOptions,
      origin: { ...baseOptions.origin, chain: 'Acala' } as TOriginInfo<unknown>,
      exchange: { ...baseOptions.exchange, chain: 'Acala' },
      destination: { ...baseOptions.destination, chain: 'Acala' } as TDestinationInfo,
    });

    expect(res).toEqual([
      {
        api: swapApiPapi,
        chain: 'Acala',
        tx: 'swapTx',
        type: 'SWAP',
        amountOut: 1000n,
      },
    ]);
  });

  test('adds transfer-to-exchange when origin differs', async () => {
    vi.mocked(prepareExtrinsicsModule.prepareExtrinsics).mockResolvedValue({
      toExchangeTx: 'toExchangeTx',
      swapTxs: ['swapTx'],
      toDestTx: undefined,
      amountOut: 1000n,
    });

    const res = await buildTransactions({ chain: 'Acala' } as ExchangeChain, baseOptions);

    expect(res).toEqual([
      {
        api: originApi,
        chain: 'BifrostPolkadot',
        destinationChain: 'Acala',
        tx: 'toExchangeTx',
        type: 'TRANSFER',
      },
      {
        api: swapApiPapi,
        chain: 'Acala',
        tx: 'swapTx',
        type: 'SWAP',
        amountOut: 1000n,
      },
    ]);
  });

  test('adds batched swap+transfer when destination differs', async () => {
    vi.mocked(prepareExtrinsicsModule.prepareExtrinsics).mockResolvedValue({
      toExchangeTx: undefined,
      swapTxs: ['swapTx'],
      toDestTx: 'toDestTx',
      amountOut: 1000n,
    });

    const res = await buildTransactions({ chain: 'Acala' } as ExchangeChain, {
      ...baseOptions,
      origin: undefined,
      exchange: { ...baseOptions.exchange, chain: 'Acala' },
    });

    expect(res).toEqual([
      {
        api: swapApiPapi,
        chain: 'Acala',
        destinationChain: 'Crust',
        tx: 'batchTx',
        type: 'SWAP_AND_TRANSFER',
        amountOut: 1000n,
      },
    ]);
  });

  test('includes all steps when both origin & destination differ', async () => {
    vi.mocked(prepareExtrinsicsModule.prepareExtrinsics).mockResolvedValue({
      toExchangeTx: 'toExchangeTx',
      swapTxs: ['swapTx'],
      toDestTx: 'toDestTx',
      amountOut: 1000n,
    });

    const res = await buildTransactions({ chain: 'Acala' } as ExchangeChain, {
      ...baseOptions,
      destination: { address: 'someAddress', chain: 'Crust' },
    });

    expect(res).toEqual([
      {
        api: originApi,
        chain: 'BifrostPolkadot',
        destinationChain: 'Acala',
        tx: 'toExchangeTx',
        type: 'TRANSFER',
      },
      {
        api: swapApiPapi,
        chain: 'Acala',
        destinationChain: 'Crust',
        tx: 'batchTx',
        type: 'SWAP_AND_TRANSFER',
        amountOut: 1000n,
      },
    ]);
  });
});
