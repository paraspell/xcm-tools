import { beforeEach, describe, expect, it, vi } from 'vitest';

import type ExchangeNode from '../../dexNodes/DexNode';
import type {
  TAdditionalTransferOptions,
  TBuildTransactionsOptions,
  TRouterXcmFeeResult,
  TTransferOptions,
} from '../../types';
import { getRouterFees } from '../getRouterFees';
import { prepareTransformedOptions, validateTransferOptions } from '../utils';
import { getXcmFees } from './getXcmFees';

vi.mock('../getRouterFees', () => ({
  getRouterFees: vi.fn(),
}));

vi.mock('../utils', () => ({
  prepareTransformedOptions: vi.fn(),
  validateTransferOptions: vi.fn(),
}));

describe('getXcmFees', () => {
  const initialOptions = { foo: 'bar' } as unknown as TBuildTransactionsOptions;
  const transformed = {
    dex: {} as ExchangeNode,
    options: { baz: 'qux' } as unknown as (TTransferOptions | TBuildTransactionsOptions) &
      TAdditionalTransferOptions,
  };
  const feeResult = { fees: [], totalFee: '0.1' } as unknown as TRouterXcmFeeResult;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates options, transforms them, and returns router fees', async () => {
    vi.mocked(validateTransferOptions).mockImplementation(() => {});
    vi.mocked(prepareTransformedOptions).mockResolvedValue(transformed);
    vi.mocked(getRouterFees).mockResolvedValue(feeResult);

    const result = await getXcmFees(initialOptions);

    expect(validateTransferOptions).toHaveBeenCalledWith(initialOptions);
    expect(prepareTransformedOptions).toHaveBeenCalledWith(initialOptions);
    expect(getRouterFees).toHaveBeenCalledWith(transformed.dex, transformed.options);
    expect(result).toBe(feeResult);
  });

  it('propagates errors from validateTransferOptions', async () => {
    const error = new Error('validation error');
    vi.mocked(validateTransferOptions).mockImplementation(() => {
      throw error;
    });

    await expect(getXcmFees(initialOptions)).rejects.toThrow('validation error');
    expect(prepareTransformedOptions).not.toHaveBeenCalled();
    expect(getRouterFees).not.toHaveBeenCalled();
  });

  it('propagates errors from prepareTransformedOptions', async () => {
    const error = new Error('prepare error');
    vi.mocked(validateTransferOptions).mockImplementation(() => {});
    vi.mocked(prepareTransformedOptions).mockRejectedValue(error);

    await expect(getXcmFees(initialOptions)).rejects.toThrow('prepare error');
    expect(getRouterFees).not.toHaveBeenCalled();
  });

  it('propagates errors from getRouterFees', async () => {
    vi.mocked(validateTransferOptions).mockImplementation(() => {});
    vi.mocked(prepareTransformedOptions).mockResolvedValue(transformed);
    const error = new Error('router error');
    vi.mocked(getRouterFees).mockRejectedValue(error);

    await expect(getXcmFees(initialOptions)).rejects.toThrow('router error');
  });
});
