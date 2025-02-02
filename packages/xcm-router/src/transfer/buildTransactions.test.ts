import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Extrinsic, TPjsApi } from '@paraspell/sdk-pjs';
import type { TBuildTransactionsOptions } from '../types';
import { buildTransactions } from './buildTransactions';
import type { prepareTransformedOptions } from './utils';
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
    prepareTransformedOptions: vi.fn(),
    buildToExchangeExtrinsic: vi.fn(),
    buildFromExchangeExtrinsic: vi.fn(),
  };
});

vi.mock('./createSwapTx', () => ({
  createSwapTx: vi.fn(),
}));

describe('buildTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(utils.prepareTransformedOptions).mockResolvedValue({
      options: {
        from: 'Acala',
        exchangeNode: 'Acala',
        to: 'Acala',
        currencyFrom: { symbol: 'CUR1' },
        currencyTo: { symbol: 'CUR2' },
        amount: '100',
        slippagePct: '1',
      } as Awaited<ReturnType<typeof prepareTransformedOptions>>['options'],
      dex: { node: 'Acala' } as ExchangeNode,
    });

    vi.mocked(createSwapTxModule.createSwapTx).mockResolvedValue({
      tx: 'swapTx' as unknown as Extrinsic,
      amountOut: '1000',
    });
  });

  test('should return only swap transaction when from and to match exchange node', async () => {
    const result = await buildTransactions(originApi, swapApi, {} as TBuildTransactionsOptions);

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
    vi.mocked(utils.prepareTransformedOptions).mockResolvedValue({
      options: {
        from: 'BifrostPolkadot',
        exchangeNode: 'Acala',
        to: 'Acala',
        currencyFrom: { symbol: 'CUR1' },
        currencyTo: { symbol: 'CUR2' },
        amount: '100',
        slippagePct: '1',
      } as Awaited<ReturnType<typeof prepareTransformedOptions>>['options'],
      dex: { node: 'Acala' } as ExchangeNode,
    });

    vi.mocked(utils.buildToExchangeExtrinsic).mockResolvedValue(
      'toExchangeTx' as unknown as Extrinsic,
    );

    const result = await buildTransactions(originApi, swapApi, {} as TBuildTransactionsOptions);

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
    vi.mocked(utils.prepareTransformedOptions).mockResolvedValue({
      options: {
        from: 'Acala',
        exchangeNode: 'Acala',
        to: 'Crust',
        currencyFrom: { symbol: 'CUR1' },
        currencyTo: { symbol: 'CUR2' },
        amount: '100',
        slippagePct: '1',
      } as Awaited<ReturnType<typeof prepareTransformedOptions>>['options'],
      dex: { node: 'Acala' } as ExchangeNode,
    });

    vi.mocked(utils.buildFromExchangeExtrinsic).mockResolvedValue(
      'toDestTx' as unknown as Extrinsic,
    );

    const result = await buildTransactions(originApi, swapApi, {} as TBuildTransactionsOptions);

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
    vi.mocked(utils.prepareTransformedOptions).mockResolvedValue({
      options: {
        from: 'BifrostPolkadot',
        exchangeNode: 'Acala',
        to: 'Crust',
        currencyFrom: { symbol: 'CUR1' },
        currencyTo: { symbol: 'CUR2' },
        amount: '100',
        slippagePct: '1',
      } as Awaited<ReturnType<typeof prepareTransformedOptions>>['options'],
      dex: { node: 'Acala' } as ExchangeNode,
    });

    vi.mocked(utils.buildToExchangeExtrinsic).mockResolvedValue(
      'toExchangeTx' as unknown as Extrinsic,
    );
    vi.mocked(utils.buildFromExchangeExtrinsic).mockResolvedValue(
      'toDestTx' as unknown as Extrinsic,
    );

    const result = await buildTransactions(originApi, swapApi, {} as TBuildTransactionsOptions);

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

    vi.mocked(utils.prepareTransformedOptions).mockResolvedValue({
      options: {
        from: 'Acala',
        exchangeNode: 'Acala',
        to: 'Crust',
        currencyFrom: { symbol: 'CUR1' },
        currencyTo: { symbol: 'CUR2' },
        amount: '100',
        slippagePct: '1',
      } as Awaited<ReturnType<typeof prepareTransformedOptions>>['options'],
      dex: { node: 'Acala' } as ExchangeNode,
    });

    await buildTransactions(originApi, swapApi, {} as TBuildTransactionsOptions);

    expect(utils.buildFromExchangeExtrinsic).toHaveBeenCalledWith(
      swapApi,
      expect.any(Object),
      amountOut,
    );
  });
});
