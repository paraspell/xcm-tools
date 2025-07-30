import { beforeEach, describe, expect, test, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TAdditionalTransferOptions, TBuildTransactionsOptions, TRouterPlan } from '../types';
import { buildApiTransactions } from './buildApiTransactions';
import { buildTransactions } from './buildTransactions';
import { prepareTransformedOptions } from './utils';
import { validateTransferOptions } from './utils/validateTransferOptions';

vi.mock('@paraspell/sdk-pjs', () => ({
  createChainClient: vi.fn(),
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
          chain: 'Acala',
          assetFrom: { symbol: 'ACA' },
        },
        exchange: {},
      } as unknown as TBuildTransactionsOptions & TAdditionalTransferOptions,
      dex: {
        chain: 'Acala',
      } as unknown as ExchangeChain,
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
