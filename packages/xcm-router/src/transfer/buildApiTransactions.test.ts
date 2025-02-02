import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { TPjsApi } from '@paraspell/sdk-pjs';
import { validateTransferOptions } from './utils/validateTransferOptions';
import { prepareTransformedOptions } from './utils';
import { buildTransactions } from './buildTransactions';
import type { TAdditionalTransferOptions, TBuildTransactionsOptions, TRouterPlan } from '../types';
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
  const mockOriginApi = { disconnect: vi.fn() } as unknown as TPjsApi;
  const mockSwapApi = { disconnect: vi.fn() } as unknown as TPjsApi;
  const mockTransactions = [{ tx: 'test' }] as unknown as TRouterPlan;

  const initialOptions = {
    to: 'BifrostPolkadot',
    amount: '100',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(validateTransferOptions).mockImplementation(() => {});

    vi.mocked(prepareTransformedOptions).mockResolvedValue({
      options: {
        ...initialOptions,
        slippagePct: '1',
        origin: {
          node: 'Acala',
          api: mockOriginApi,
          assetFrom: { symbol: 'ACA' },
        },
        exchange: {
          api: mockSwapApi,
        },
      } as unknown as TBuildTransactionsOptions & TAdditionalTransferOptions,
      dex: {
        node: 'Acala',
        createApiInstance: vi.fn().mockResolvedValue(mockSwapApi),
      } as unknown as ExchangeNode,
    });

    vi.mocked(buildTransactions).mockResolvedValue(mockTransactions);
  });

  test('should create API instances, build transactions, and disconnect', async () => {
    const disconnectSpy = vi.spyOn(mockOriginApi, 'disconnect');
    const swapDisconnectSpy = vi.spyOn(mockSwapApi, 'disconnect');

    const result = await buildApiTransactions(initialOptions as TBuildTransactionsOptions);

    expect(validateTransferOptions).toHaveBeenCalledWith(initialOptions);

    expect(prepareTransformedOptions).toHaveBeenCalledWith(initialOptions);

    expect(buildTransactions).toHaveBeenCalledOnce();
    expect(disconnectSpy).toHaveBeenCalled();
    expect(swapDisconnectSpy).toHaveBeenCalled();

    expect(result).toEqual(mockTransactions);
  });

  test('should disconnect APIs even if buildTransactions fails', async () => {
    const mockError = new Error('Build transactions failed');
    vi.mocked(buildTransactions).mockRejectedValueOnce(mockError);

    const disconnectSpy = vi.spyOn(mockOriginApi, 'disconnect');
    const swapDisconnectSpy = vi.spyOn(mockSwapApi, 'disconnect');

    await expect(buildApiTransactions(initialOptions as TBuildTransactionsOptions)).rejects.toThrow(
      mockError,
    );
    expect(disconnectSpy).toHaveBeenCalled();
    expect(swapDisconnectSpy).toHaveBeenCalled();
  });
});
