// Unit tests for selectBestExchange function

import { describe, it, expect, vi, afterAll } from 'vitest';
import * as utils from '../utils/utils';
import * as transferUtils from './utils';
import * as dexNodeFactory from '../dexNodes/DexNodeFactory';
import { selectBestExchange } from './selectBestExchange';
import { MOCK_TRANSFER_OPTIONS } from '../utils/utils.test';
import { type TTransferOptions } from '../types';
import type ExchangeNode from '../dexNodes/DexNode';
import { createApiInstanceForNode } from '@paraspell/sdk';

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    createApiInstanceForNode: vi.fn().mockResolvedValue(undefined),
  };
});

describe('selectBestExchange', () => {
  afterAll(() => {
    vi.resetAllMocks();
  });

  it('should find best exchange', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: 'AcalaDex',
    };

    const fromExchangeTxSpy = vi
      .spyOn(transferUtils, 'buildFromExchangeExtrinsic')
      .mockReturnValue({} as any);
    const toExchangeTxSpy = vi
      .spyOn(transferUtils, 'buildToExchangeExtrinsic')
      .mockReturnValue({} as any);
    const feeSpy = vi.spyOn(utils, 'calculateTransactionFee').mockReturnValue({} as any);
    vi.spyOn(dexNodeFactory, 'default').mockReturnValue({
      node: 'Acala',
      createApiInstance: vi.fn().mockResolvedValue({}),
      swapCurrency: vi.fn().mockResolvedValue({ amountOut: '1' }),
    } as unknown as ExchangeNode);

    const result = await selectBestExchange(options);

    expect(result).toBeDefined();
    expect(createApiInstanceForNode).toHaveBeenCalled();
    expect(feeSpy).toHaveBeenCalled();
    expect(fromExchangeTxSpy).toHaveBeenCalledTimes(2);
    expect(toExchangeTxSpy).toHaveBeenCalled();
  });

  it('should fail to find best exchange', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: 'AcalaDex',
    };

    vi.spyOn(dexNodeFactory, 'default').mockReturnValue({
      node: 'Acala',
      createApiInstance: vi.fn().mockResolvedValue({}),
      swapCurrency: vi.fn().mockResolvedValue(Promise.reject(new Error('test'))),
    } as unknown as ExchangeNode);

    await expect(selectBestExchange(options)).rejects.toThrow('test');
  });
});
