import type { TPapiApi, TPapiTransaction } from '@paraspell/sdk';
import type { TPjsApi } from '@paraspell/sdk-pjs';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TBuildTransactionsOptionsModified, TDestinationInfo, TOriginInfo } from '../types';
import { buildTransactions } from './buildTransactions';
import * as prepareExtrinsicsModule from './prepareExtrinsics';

const originApi = {} as TPapiApi;
const swapApi = {} as TPjsApi;

const swapApiPapi = {
  getUnsafeApi: () => ({
    tx: {
      Utility: {
        batch_all: vi.fn().mockReturnValue('batchTx' as unknown as TPapiTransaction),
      },
    },
  }),
} as unknown as TPapiApi;

vi.mock('./prepareExtrinsics', () => ({
  prepareExtrinsics: vi.fn(),
}));

const baseOptions = {
  origin: {
    api: originApi,
    chain: 'BifrostPolkadot',
    assetFrom: { symbol: 'ACA' },
  },
  exchange: {
    baseChain: 'Acala',
    api: swapApi,
    apiPapi: swapApiPapi,
  },
  destination: {
    address: 'someAddress',
    chain: 'Crust',
  },
} as TBuildTransactionsOptionsModified;

describe('buildTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(prepareExtrinsicsModule.prepareExtrinsics).mockResolvedValue({
      toExchangeTx: undefined,
      swapTxs: ['swapTx' as unknown as TPapiTransaction],
      toDestTx: undefined,
      amountOut: 1000n,
    });
  });

  test('returns only swap tx when origin & destination are the exchange chain', async () => {
    const res = await buildTransactions({ chain: 'Acala' } as ExchangeChain, {
      ...baseOptions,
      origin: { ...baseOptions.origin, chain: 'Acala' } as TOriginInfo,
      exchange: { ...baseOptions.exchange, baseChain: 'Acala', exchangeChain: 'AcalaDex' },
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
      toExchangeTx: 'toExchangeTx' as unknown as TPapiTransaction,
      swapTxs: ['swapTx' as unknown as TPapiTransaction],
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
      swapTxs: ['swapTx' as unknown as TPapiTransaction],
      toDestTx: 'toDestTx' as unknown as TPapiTransaction,
      amountOut: 1000n,
    });

    const res = await buildTransactions({ chain: 'Acala' } as ExchangeChain, {
      ...baseOptions,
      origin: undefined,
      exchange: { ...baseOptions.exchange, baseChain: 'Acala' },
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
      toExchangeTx: 'toExchangeTx' as unknown as TPapiTransaction,
      swapTxs: ['swapTx' as unknown as TPapiTransaction],
      toDestTx: 'toDestTx' as unknown as TPapiTransaction,
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
