import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Extrinsic, TPjsApi } from '@paraspell/sdk-pjs';
import type { TBuildTransactionsOptionsModified } from '../types';
import { buildTransactions } from './buildTransactions';
import type ExchangeNode from '../dexNodes/DexNode';
import * as utils from './utils';
import * as createSwapTxModule from './createSwapTx';

const originApi = {} as TPjsApi;
const swapApi = {
  tx: {
    utility: {
      batch: vi.fn().mockReturnValue('batchTx' as unknown as Extrinsic),
    },
  },
} as unknown as TPjsApi;

vi.mock('./utils', async (importOriginal) => {
  const actual = await importOriginal<typeof utils>();
  return {
    ...actual,
    buildToExchangeExtrinsic: vi.fn(),
    buildFromExchangeExtrinsic: vi.fn(),
  };
});

vi.mock('./createSwapTx', () => ({
  createSwapTx: vi.fn(),
}));

describe('buildTransactions', () => {
  const options = {
    origin: {
      api: originApi,
      node: 'BifrostPolkadot',
      assetFrom: { symbol: 'ACA' },
    },
    exchange: {
      baseNode: 'Acala',
      api: swapApi,
    },
    destination: {
      address: 'someAddress',
      node: 'Crust',
    },
  } as TBuildTransactionsOptionsModified;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(createSwapTxModule.createSwapTx).mockResolvedValue({
      tx: 'swapTx' as unknown as Extrinsic,
      amountOut: '1000',
    });
  });

  test('should return only swap transaction when from and to match exchange node', async () => {
    const result = await buildTransactions({ node: 'Acala' } as ExchangeNode, {
      ...options,
      origin: {
        ...options.origin,
        node: 'Acala',
      } as unknown as TBuildTransactionsOptionsModified['origin'],
      exchange: {
        ...options.exchange,
        baseNode: 'Acala',
        exchangeNode: 'AcalaDex',
      },
      to: 'Acala',
      destination: {
        address: 'someAddress',
        node: 'Acala',
      },
    });

    expect(result).toEqual([
      {
        api: swapApi,
        node: 'Acala',
        tx: 'swapTx',
        type: 'SWAP',
      },
    ]);

    expect(utils.buildToExchangeExtrinsic).not.toHaveBeenCalled();
    expect(utils.buildFromExchangeExtrinsic).not.toHaveBeenCalled();
  });

  test('should include transfer-to-exchange and swap transactions when from differs', async () => {
    vi.mocked(utils.buildToExchangeExtrinsic).mockResolvedValue(
      'toExchangeTx' as unknown as Extrinsic,
    );

    const result = await buildTransactions({ node: 'Acala' } as ExchangeNode, options);

    expect(result).toEqual([
      {
        api: originApi,
        node: 'BifrostPolkadot',
        destinationNode: 'Acala',
        tx: 'toExchangeTx',
        type: 'TRANSFER',
      },
      {
        api: swapApi,
        node: 'Acala',
        tx: 'swapTx',
        type: 'SWAP',
      },
    ]);
  });

  test('should include swap and transfer-from-exchange transactions when to differs', async () => {
    vi.mocked(utils.buildFromExchangeExtrinsic).mockResolvedValue(
      'toDestTx' as unknown as Extrinsic,
    );

    const result = await buildTransactions({ node: 'Acala' } as ExchangeNode, {
      ...options,
      origin: undefined,
      exchange: {
        ...options.exchange,
        baseNode: 'Acala',
      },
      to: 'Crust',
    });

    expect(result).toEqual([
      {
        api: expect.any(Object),
        node: 'Acala',
        destinationNode: 'Crust',
        tx: 'batchTx',
        type: 'SWAP_AND_TRANSFER',
      },
    ]);
  });

  test('should include all transactions when both from and to differ', async () => {
    vi.mocked(utils.buildToExchangeExtrinsic).mockResolvedValue(
      'toExchangeTx' as unknown as Extrinsic,
    );
    vi.mocked(utils.buildFromExchangeExtrinsic).mockResolvedValue(
      'toDestTx' as unknown as Extrinsic,
    );

    const result = await buildTransactions({ node: 'Acala' } as ExchangeNode, {
      ...options,
      from: 'BifrostPolkadot',
      to: 'Crust',
      destination: {
        address: 'someAddress',
        node: 'Crust',
      },
    });

    expect(result).toEqual([
      {
        api: expect.any(Object),
        node: 'BifrostPolkadot',
        destinationNode: 'Acala',
        tx: 'toExchangeTx',
        type: 'TRANSFER',
      },
      {
        api: expect.any(Object),
        node: 'Acala',
        destinationNode: 'Crust',
        tx: 'batchTx',
        type: 'SWAP_AND_TRANSFER',
      },
    ]);
  });

  test('should pass correct amountOut to buildFromExchangeExtrinsic', async () => {
    const amountOut = '500';
    vi.mocked(createSwapTxModule.createSwapTx).mockResolvedValue({
      tx: 'swapTx' as unknown as Extrinsic,
      amountOut,
    });

    await buildTransactions({ node: 'Acala' } as ExchangeNode, {
      ...options,
      to: 'Crust',
    });

    expect(utils.buildFromExchangeExtrinsic).toHaveBeenCalledWith(expect.any(Object));
  });
});
