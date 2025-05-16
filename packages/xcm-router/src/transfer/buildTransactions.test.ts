import type { TPapiApi, TPapiTransaction } from '@paraspell/sdk';
import type { TPjsApi } from '@paraspell/sdk-pjs';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type ExchangeNode from '../dexNodes/DexNode';
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
    node: 'BifrostPolkadot',
    assetFrom: { symbol: 'ACA' },
  },
  exchange: {
    baseNode: 'Acala',
    api: swapApi,
    apiPapi: swapApiPapi,
  },
  destination: {
    address: 'someAddress',
    node: 'Crust',
  },
} as TBuildTransactionsOptionsModified;

describe('buildTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    /* default mock: nothing extra to / from exchange */
    vi.mocked(prepareExtrinsicsModule.prepareExtrinsics).mockResolvedValue({
      toExchangeTx: undefined,
      swapTx: 'swapTx' as unknown as TPapiTransaction,
      toDestTx: undefined,
      amountOut: 1000n,
    });
  });

  test('returns only swap tx when origin & destination are the exchange node', async () => {
    const res = await buildTransactions({ node: 'Acala' } as ExchangeNode, {
      ...baseOptions,
      origin: { ...baseOptions.origin, node: 'Acala' } as TOriginInfo,
      exchange: { ...baseOptions.exchange, baseNode: 'Acala', exchangeNode: 'AcalaDex' },
      destination: { ...baseOptions.destination, node: 'Acala' } as TDestinationInfo,
    });

    expect(res).toEqual([
      {
        api: swapApiPapi,
        node: 'Acala',
        tx: 'swapTx',
        type: 'SWAP',
        amountOut: 1000n,
      },
    ]);
  });

  test('adds transfer-to-exchange when origin differs', async () => {
    vi.mocked(prepareExtrinsicsModule.prepareExtrinsics).mockResolvedValue({
      toExchangeTx: 'toExchangeTx' as unknown as TPapiTransaction,
      swapTx: 'swapTx' as unknown as TPapiTransaction,
      toDestTx: undefined,
      amountOut: 1000n,
    });

    const res = await buildTransactions({ node: 'Acala' } as ExchangeNode, baseOptions);

    expect(res).toEqual([
      {
        api: originApi,
        node: 'BifrostPolkadot',
        destinationNode: 'Acala',
        tx: 'toExchangeTx',
        type: 'TRANSFER',
      },
      {
        api: swapApiPapi,
        node: 'Acala',
        tx: 'swapTx',
        type: 'SWAP',
        amountOut: 1000n,
      },
    ]);
  });

  test('adds batched swap+transfer when destination differs', async () => {
    vi.mocked(prepareExtrinsicsModule.prepareExtrinsics).mockResolvedValue({
      toExchangeTx: undefined,
      swapTx: 'swapTx' as unknown as TPapiTransaction,
      toDestTx: 'toDestTx' as unknown as TPapiTransaction,
      amountOut: 1000n,
    });

    const res = await buildTransactions({ node: 'Acala' } as ExchangeNode, {
      ...baseOptions,
      origin: undefined,
      exchange: { ...baseOptions.exchange, baseNode: 'Acala' },
    });

    expect(res).toEqual([
      {
        api: swapApiPapi,
        node: 'Acala',
        destinationNode: 'Crust',
        tx: 'batchTx',
        type: 'SWAP_AND_TRANSFER',
      },
    ]);
  });

  test('includes all steps when both origin & destination differ', async () => {
    vi.mocked(prepareExtrinsicsModule.prepareExtrinsics).mockResolvedValue({
      toExchangeTx: 'toExchangeTx' as unknown as TPapiTransaction,
      swapTx: 'swapTx' as unknown as TPapiTransaction,
      toDestTx: 'toDestTx' as unknown as TPapiTransaction,
      amountOut: 1000n,
    });

    const res = await buildTransactions({ node: 'Acala' } as ExchangeNode, {
      ...baseOptions,
      destination: { address: 'someAddress', node: 'Crust' },
    });

    expect(res).toEqual([
      {
        api: originApi,
        node: 'BifrostPolkadot',
        destinationNode: 'Acala',
        tx: 'toExchangeTx',
        type: 'TRANSFER',
      },
      {
        api: swapApiPapi,
        node: 'Acala',
        destinationNode: 'Crust',
        tx: 'batchTx',
        type: 'SWAP_AND_TRANSFER',
      },
    ]);
  });
});
