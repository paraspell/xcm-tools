import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { TPjsApi } from '@paraspell/sdk-pjs';
import { createApiInstanceForNode } from '@paraspell/sdk-pjs';
import { validateTransferOptions } from './utils/validateTransferOptions';
import { prepareTransformedOptions } from './utils';
import { buildTransactions } from './buildTransactions';
import type { TBuildTransactionsOptions, TRouterPlan } from '../types';
import type ExchangeNode from '../dexNodes/DexNode';
import { buildApiTransactions } from './buildApiTransactions';

vi.mock('@paraspell/sdk-pjs', () => ({
  createApiInstanceForNode: vi.fn(),
}));

vi.mock('./utils/validateTransferOptions', () => ({
  validateTransferOptions: vi.fn(),
}));

vi.mock('./utils', () => ({
  prepareTransformedOptions: vi.fn(),
}));

vi.mock('./buildTransactions', () => ({
  buildTransactions: vi.fn(),
}));

describe('buildApiTransactions', () => {
  const mockOriginApi = { disconnect: vi.fn() };
  const mockSwapApi = { disconnect: vi.fn() };
  const mockTransactions = [{ tx: 'test' }] as unknown as TRouterPlan;

  const initialOptions = {
    from: 'Acala',
    to: 'BifrostPolkadot',
    amount: '100',
    currencyFrom: { symbol: 'CUR1' },
    currencyTo: { symbol: 'CUR2' },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(validateTransferOptions).mockImplementation(() => {});

    vi.mocked(prepareTransformedOptions).mockResolvedValue({
      options: {
        ...initialOptions,
        exchangeNode: 'Acala',
        slippagePct: '1',
      } as Awaited<ReturnType<typeof prepareTransformedOptions>>['options'],
      dex: {
        node: 'Acala',
        createApiInstance: vi.fn().mockResolvedValue(mockSwapApi),
      } as unknown as ExchangeNode,
    });

    vi.mocked(createApiInstanceForNode).mockResolvedValue(mockOriginApi as unknown as TPjsApi);
    vi.mocked(buildTransactions).mockResolvedValue(mockTransactions);
  });

  test('should create API instances, build transactions, and disconnect', async () => {
    const result = await buildApiTransactions(initialOptions as TBuildTransactionsOptions);

    expect(validateTransferOptions).toHaveBeenCalledWith(initialOptions);

    expect(createApiInstanceForNode).toHaveBeenCalledWith('Acala');
    expect(prepareTransformedOptions).toHaveBeenCalledWith(initialOptions);

    expect(buildTransactions).toHaveBeenCalledWith(
      mockOriginApi,
      mockSwapApi,
      expect.objectContaining({
        from: 'Acala',
        to: 'BifrostPolkadot',
        amount: '100',
      }),
    );

    expect(mockOriginApi.disconnect).toHaveBeenCalled();
    expect(mockSwapApi.disconnect).toHaveBeenCalled();

    expect(result).toEqual(mockTransactions);
  });

  test('should handle dex API creation failure', async () => {
    const mockError = new Error('API connection failed');
    vi.mocked(prepareTransformedOptions).mockResolvedValueOnce({
      options: {
        ...initialOptions,
        exchangeNode: 'Acala',
        slippagePct: '1',
      } as Awaited<ReturnType<typeof prepareTransformedOptions>>['options'],
      dex: {
        node: 'Acala',
        createApiInstance: vi.fn().mockRejectedValue(mockError),
      } as unknown as ExchangeNode,
    });

    await expect(buildApiTransactions(initialOptions as TBuildTransactionsOptions)).rejects.toThrow(
      mockError,
    );
  });

  test('should disconnect APIs even if buildTransactions fails', async () => {
    const mockError = new Error('Build transactions failed');
    vi.mocked(buildTransactions).mockRejectedValueOnce(mockError);

    await expect(buildApiTransactions(initialOptions as TBuildTransactionsOptions)).rejects.toThrow(
      mockError,
    );
    expect(mockOriginApi.disconnect).toHaveBeenCalled();
    expect(mockSwapApi.disconnect).toHaveBeenCalled();
  });
});
