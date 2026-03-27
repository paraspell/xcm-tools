import type { IPolkadotApi } from '@paraspell/sdk-core';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type ExchangeChain from '../exchanges/ExchangeChain';
import type { TAdditionalTransferOptions, TBuildTransactionsOptions, TRouterPlan } from '../types';
import { buildApiTransactions } from './buildApiTransactions';
import { buildTransactions } from './buildTransactions';
import { prepareTransformedOptions } from './utils';
import { validateTransferOptions } from './utils/validateTransferOptions';

const mockApi = {} as IPolkadotApi<unknown, unknown, unknown>;

vi.mock('@paraspell/sdk-pjs');

vi.mock('./utils/validateTransferOptions');
vi.mock('./utils');
vi.mock('./buildTransactions');

describe('buildApiTransactions', () => {
  const mockTransactions = [{ tx: 'test' }] as unknown as TRouterPlan<unknown, unknown>;

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
        api: mockApi,
      } as unknown as TBuildTransactionsOptions<unknown, unknown, unknown> &
        TAdditionalTransferOptions<unknown, unknown, unknown>,
      dex: {
        chain: 'Acala',
      } as unknown as ExchangeChain,
    });

    vi.mocked(buildTransactions).mockResolvedValue(mockTransactions);
  });

  test('should create API instances, build transactions, and disconnect', async () => {
    const result = await buildApiTransactions({
      ...initialOptions,
      api: mockApi,
    } as TBuildTransactionsOptions<unknown, unknown, unknown> & {
      api: IPolkadotApi<unknown, unknown, unknown>;
    });

    expect(validateTransferOptions).toHaveBeenCalledWith({ ...initialOptions, api: mockApi });
    expect(prepareTransformedOptions).toHaveBeenCalledWith({ ...initialOptions, api: mockApi });
    expect(buildTransactions).toHaveBeenCalledOnce();
    expect(result).toEqual(mockTransactions);
  });

  test('should disconnect APIs even if buildTransactions fails', async () => {
    const mockError = new Error('Build transactions failed');
    vi.mocked(buildTransactions).mockRejectedValueOnce(mockError);

    await expect(
      buildApiTransactions({ ...initialOptions, api: mockApi } as TBuildTransactionsOptions<
        unknown,
        unknown,
        unknown
      >),
    ).rejects.toThrow(mockError);
  });
});
