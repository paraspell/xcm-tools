import type { TAssetInfo, TXcmFeeDetailWithForwardedXcm } from '@paraspell/sdk-core';
import { describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../../types';
import { getSwapOriginFee } from '../getSwapOriginFee';
import { prepareTransformedOptions, validateTransferOptions } from '../utils';
import { getOriginXcmFee } from './getOriginXcmFee';

vi.mock('../getSwapOriginFee');
vi.mock('../utils');

describe('getOriginXcmFee', () => {
  it('should validate options, prepare them, and return router origin fee', async () => {
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
    const mockFeeResult: TXcmFeeDetailWithForwardedXcm<true> = {
      fee: 10n,
      feeType: 'dryRun',
      asset: mockAsset,
    };

    vi.mocked(validateTransferOptions).mockImplementation(() => {});
    vi.mocked(prepareTransformedOptions).mockResolvedValue({
      dex: mockDex,
      options: mockTransformedOptions,
    });
    vi.mocked(getSwapOriginFee).mockResolvedValue(mockFeeResult);

    const initialOptions = {} as TBuildTransactionsOptions<unknown, unknown, unknown>;

    const result = await getOriginXcmFee(initialOptions, true);

    expect(validateTransferOptions).toHaveBeenCalledWith(initialOptions);
    expect(prepareTransformedOptions).toHaveBeenCalledWith(initialOptions, true);
    expect(getSwapOriginFee).toHaveBeenCalledWith(mockDex, mockTransformedOptions, true);
    expect(result).toBe(mockFeeResult);
  });
});
