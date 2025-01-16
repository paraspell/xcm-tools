// Unit tests for selectBestExchange function

import { describe, it, expect, vi, afterAll, beforeAll, type MockInstance } from 'vitest';
import * as utils from '../utils/utils';
import * as transferUtils from './utils';
import { selectBestExchange } from './selectBestExchange';
import { type TTransferOptions } from '../types';
import type ExchangeNode from '../dexNodes/DexNode';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import { createApiInstanceForNode } from '@paraspell/sdk-pjs';
import BigNumber from 'bignumber.js';
import { MOCK_TRANSFER_OPTIONS } from '../utils/testUtils';
import { createDexNodeInstance } from '../dexNodes/DexNodeFactory';

vi.mock('@paraspell/sdk-pjs', async () => {
  const actual = await vi.importActual('@paraspell/sdk-pjs');
  return {
    ...actual,
    createApiInstanceForNode: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../dexNodes/DexNodeFactory', () => ({
  createDexNodeInstance: vi.fn(),
}));

describe('selectBestExchange', () => {
  let options: TTransferOptions;
  let fromExchangeTxSpy: MockInstance, toExchangeTxSpy: MockInstance, feeSpy: MockInstance;

  beforeAll(() => {
    fromExchangeTxSpy = vi
      .spyOn(transferUtils, 'buildFromExchangeExtrinsic')
      .mockResolvedValue({} as Extrinsic);
    toExchangeTxSpy = vi
      .spyOn(transferUtils, 'buildToExchangeExtrinsic')
      .mockResolvedValue({} as Extrinsic);
    feeSpy = vi.spyOn(utils, 'calculateTransactionFee').mockResolvedValue(BigNumber(2000));
  });

  afterAll(() => {
    vi.resetAllMocks();
  });

  it('should find best exchange', async () => {
    options = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: { id: '18446744073709551619' },
      currencyTo: { id: '18446744073709551616' },
      exchange: 'AcalaDex',
    };
    vi.mocked(createDexNodeInstance).mockReturnValue({
      node: 'Acala',
      createApiInstance: vi.fn().mockResolvedValue({}),
      swapCurrency: vi.fn().mockResolvedValue({ amountOut: '1' }),
    } as unknown as ExchangeNode);

    const result = await selectBestExchange(options);

    expect(result).toBeDefined();
    expect(createApiInstanceForNode).toHaveBeenCalled();
    expect(feeSpy).toHaveBeenCalled();
    expect(fromExchangeTxSpy).toHaveBeenCalledTimes(1);
    expect(toExchangeTxSpy).toHaveBeenCalled();
  });

  it('should fail to find best exchange', async () => {
    options = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: { id: '18446744073709551619' },
      currencyTo: { id: '18446744073709551616' },
      exchange: 'AcalaDex',
    };
    vi.mocked(createDexNodeInstance).mockReturnValue({
      node: 'Acala',
      createApiInstance: vi.fn().mockResolvedValue({}),
      swapCurrency: vi.fn().mockResolvedValue(Promise.reject(new Error('test'))),
    } as unknown as ExchangeNode);

    await expect(selectBestExchange(options)).rejects.toThrow('test');
  });

  it('should fail to find best exchange when asset from is not supported', async () => {
    options = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: { id: 'xyz' },
      currencyTo: { id: '1000099' },
      exchange: 'AcalaDex',
    };
    vi.mocked(createDexNodeInstance).mockReturnValue({
      node: 'Acala',
      createApiInstance: vi.fn().mockResolvedValue({}),
      swapCurrency: vi.fn().mockResolvedValue({ amountOut: '1' }),
    } as unknown as ExchangeNode);

    await expect(selectBestExchange(options)).rejects.toThrow(
      `Currency from ${JSON.stringify(options.currencyFrom)} is not supported by ${options.from}`,
    );
  });
});
