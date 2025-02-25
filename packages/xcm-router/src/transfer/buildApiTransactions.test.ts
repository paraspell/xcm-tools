import { describe, test, expect, vi, beforeEach } from 'vitest';
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
          assetFrom: { symbol: 'ACA' },
        },
        exchange: {},
      } as unknown as TBuildTransactionsOptions & TAdditionalTransferOptions,
      dex: {
        node: 'Acala',
      } as unknown as ExchangeNode,
    });

    vi.mocked(buildTransactions).mockResolvedValue(mockTransactions);
  });

  test('should create API instances, build transactions, and disconnect', async () => {
    const result = await buildApiTransactions(initialOptions as TBuildTransactionsOptions);

    expect(validateTransferOptions).toHaveBeenCalledWith(initialOptions);
    expect(prepareTransformedOptions).toHaveBeenCalledWith(initialOptions);
    expect(buildTransactions).toHaveBeenCalledOnce();
    expect(result).toEqual(mockTransactions);
  });

  test('should disconnect APIs even if buildTransactions fails', async () => {
    const mockError = new Error('Build transactions failed');
    vi.mocked(buildTransactions).mockRejectedValueOnce(mockError);

    await expect(buildApiTransactions(initialOptions as TBuildTransactionsOptions)).rejects.toThrow(
      mockError,
    );
  });
});
