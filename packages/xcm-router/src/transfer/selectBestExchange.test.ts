// Unit tests for selectBestExchange function

import BigNumber from 'bignumber.js';
import { afterAll, beforeAll, describe, expect, it, type MockInstance, vi } from 'vitest';

import type ExchangeNode from '../dexNodes/DexNode';
import { createDexNodeInstance } from '../dexNodes/DexNodeFactory';
import type { TCommonTransferOptions } from '../types';
import { MOCK_TRANSFER_OPTIONS } from '../utils/testUtils';
import { calculateFromExchangeFee, calculateToExchangeWeight } from './createSwapTx';
import { selectBestExchange } from './selectBestExchange';

vi.mock('../dexNodes/DexNodeFactory', () => ({
  createDexNodeInstance: vi.fn(),
}));

vi.mock('./createSwapTx', () => ({
  createSwapTx: vi.fn(),
  calculateFromExchangeFee: vi.fn(),
  calculateToExchangeFee: vi.fn(),
  calculateToExchangeWeight: vi.fn(),
}));

describe('selectBestExchange', () => {
  let options: TCommonTransferOptions;
  let calculateFromExchangeFeeSpy: MockInstance, calculateToExchangeFeeSpy: MockInstance;

  beforeAll(() => {
    calculateFromExchangeFeeSpy = vi
      .mocked(calculateFromExchangeFee)
      .mockResolvedValue(BigNumber(10));
    calculateToExchangeFeeSpy = vi.mocked(calculateToExchangeWeight).mockResolvedValue({
      proofSize: BigNumber(10),
      refTime: BigNumber(10),
    });
  });

  afterAll(() => {
    vi.resetAllMocks();
  });

  it('should find best exchange', async () => {
    options = {
      ...MOCK_TRANSFER_OPTIONS,
      currencyFrom: { id: '18446744073709551619' },
      currencyTo: { symbol: 'HDX' },
      exchange: 'AcalaDex',
    };

    vi.mocked(createDexNodeInstance).mockReturnValue({
      node: 'Acala',
      exchangeNode: 'AcalaDex',
      createApiInstance: vi.fn().mockResolvedValue({}),
      swapCurrency: vi.fn().mockResolvedValue({ amountOut: '1' }),
    } as unknown as ExchangeNode);

    const result = await selectBestExchange(options);

    expect(result).toBeDefined();
    expect(calculateFromExchangeFeeSpy).toHaveBeenCalled();
    expect(calculateToExchangeFeeSpy).toHaveBeenCalled();
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
      `Currency from ${JSON.stringify(options.currencyFrom)} not found in ${options.from}`,
    );
  });
});
