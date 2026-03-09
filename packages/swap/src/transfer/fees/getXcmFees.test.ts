import type { TGetXcmFeeResult } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeChain from '../../exchanges/ExchangeChain';
import type {
  TAdditionalTransferOptions,
  TBuildTransactionsOptions,
  TTransferOptions,
} from '../../types';
import { getRouterFees } from '../getRouterFees';
import { prepareTransformedOptions, validateTransferOptions } from '../utils';
import { getXcmFees } from './getXcmFees';

vi.mock('../getRouterFees');
vi.mock('../utils');

describe('getXcmFees', () => {
  const initialOptions = { foo: 'bar' } as unknown as TBuildTransactionsOptions;
  const transformed = {
    dex: {} as ExchangeChain,
    options: { baz: 'qux' } as unknown as (TTransferOptions | TBuildTransactionsOptions) &
      TAdditionalTransferOptions,
  };
  const feeResult = { fees: [], totalFee: '0.1' } as unknown as TGetXcmFeeResult;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates options, transforms them, and returns router fees', async () => {
    vi.mocked(validateTransferOptions).mockImplementation(() => {});
    vi.mocked(prepareTransformedOptions).mockResolvedValue(transformed);
    vi.mocked(getRouterFees).mockResolvedValue(feeResult);

    const result = await getXcmFees(initialOptions, false);

    expect(validateTransferOptions).toHaveBeenCalledWith(initialOptions);
    expect(prepareTransformedOptions).toHaveBeenCalledWith(initialOptions, undefined, true);
    expect(getRouterFees).toHaveBeenCalledWith(transformed.dex, transformed.options, false);
    expect(result).toBe(feeResult);
  });

  it('propagates errors from validateTransferOptions', async () => {
    const error = new Error('validation error');
    vi.mocked(validateTransferOptions).mockImplementation(() => {
      throw error;
    });

    await expect(getXcmFees(initialOptions, false)).rejects.toThrow('validation error');
    expect(prepareTransformedOptions).not.toHaveBeenCalled();
    expect(getRouterFees).not.toHaveBeenCalled();
  });

  it('propagates errors from prepareTransformedOptions', async () => {
    const error = new Error('prepare error');
    vi.mocked(validateTransferOptions).mockImplementation(() => {});
    vi.mocked(prepareTransformedOptions).mockRejectedValue(error);

    await expect(getXcmFees(initialOptions, false)).rejects.toThrow('prepare error');
    expect(getRouterFees).not.toHaveBeenCalled();
  });

  it('propagates errors from getRouterFees', async () => {
    vi.mocked(validateTransferOptions).mockImplementation(() => {});
    vi.mocked(prepareTransformedOptions).mockResolvedValue(transformed);
    const error = new Error('router error');
    vi.mocked(getRouterFees).mockRejectedValue(error);

    await expect(getXcmFees(initialOptions, false)).rejects.toThrow('router error');
  });
});
