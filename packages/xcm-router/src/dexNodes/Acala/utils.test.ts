// Unit tests for Acala utils

import { describe, it, expect, vi } from 'vitest';
import { convertCurrency } from './utils';
import { type Wallet } from '@acala-network/sdk';

const INITIAL_AMOUNT = 100;
const PRICE_ACA_TO_DOT = 2;
const PRICE_DOT_TO_ACA = 0.5;
const PRICE_ERROR = 0;

describe('convertCurrency', () => {
  it('should correctly convert currency amounts from ACA to DOT', async () => {
    const walletMock: Wallet = {
      getPrice: vi
        .fn()
        .mockResolvedValueOnce({ toNumber: () => PRICE_ACA_TO_DOT })
        .mockResolvedValueOnce({ toNumber: () => PRICE_DOT_TO_ACA }),
    } as unknown as Wallet;

    const result = await convertCurrency(walletMock, 'ACA', 'DOT', INITIAL_AMOUNT);
    const expectedConversion: number = INITIAL_AMOUNT * (PRICE_ACA_TO_DOT / PRICE_DOT_TO_ACA);
    expect(result).toBe(expectedConversion);
  });

  it('should throw an error if unable to fetch price for DOT', async () => {
    const walletMock: Wallet = {
      getPrice: vi
        .fn()
        .mockResolvedValueOnce({ toNumber: () => PRICE_ACA_TO_DOT })
        .mockResolvedValueOnce({ toNumber: () => PRICE_ERROR }),
    } as unknown as Wallet;

    await expect(convertCurrency(walletMock, 'ACA', 'DOT', INITIAL_AMOUNT)).rejects.toThrow(
      'Could not fetch price for DOT',
    );
  });
});
