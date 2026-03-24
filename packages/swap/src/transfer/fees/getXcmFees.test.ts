import type { TAssetInfo, TGetXcmFeeResult } from '@paraspell/sdk-core';
import { describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../../types';
import { getRouterFees } from '../getRouterFees';
import { prepareTransformedOptions, validateTransferOptions } from '../utils';
import { getXcmFees } from './getXcmFees';

vi.mock('../getRouterFees');
vi.mock('../utils');

describe('getXcmFees', () => {
  it('should validate options, prepare them, and return router fees', async () => {
    const mockDex = {} as ExchangeChain;
    const mockTransformedOptions = {} as TTransformedOptions<
      TBuildTransactionsOptions<unknown, unknown, unknown>,
      unknown,
      unknown,
      unknown
    >;
    const mockAsset: TAssetInfo = {
      symbol: 'DOT',
      decimals: 10,
      location: { parents: 1, interior: 'Here' },
    };
    const mockFeeResult: TGetXcmFeeResult = {
      origin: { fee: 10n, feeType: 'dryRun', asset: mockAsset },
      hops: [],
      destination: { fee: 5n, feeType: 'dryRun', asset: mockAsset },
    };

    vi.mocked(validateTransferOptions).mockImplementation(() => {});
    vi.mocked(prepareTransformedOptions).mockResolvedValue({
      dex: mockDex,
      options: mockTransformedOptions,
    });
    vi.mocked(getRouterFees).mockResolvedValue(mockFeeResult);

    const initialOptions = {} as TBuildTransactionsOptions<unknown, unknown, unknown>;

    const result = await getXcmFees(initialOptions, true);

    expect(validateTransferOptions).toHaveBeenCalledWith(initialOptions);
    expect(prepareTransformedOptions).toHaveBeenCalledWith(initialOptions, true);
    expect(getRouterFees).toHaveBeenCalledWith(mockDex, mockTransformedOptions, true);
    expect(result).toBe(mockFeeResult);
  });
});
