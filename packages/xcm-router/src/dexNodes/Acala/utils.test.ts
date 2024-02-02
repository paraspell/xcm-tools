// Unit tests for Acala utils

import { describe, it, expect, vi } from 'vitest';
import { convertCurrency } from './utils';
import { type Wallet } from '@acala-network/sdk';

describe('convertCurrency', () => {
  it('should correctly convert currency amounts', async () => {
    const walletMock = {
      getPrice: vi
        .fn()
        .mockResolvedValueOnce({ toNumber: () => 2 })
        .mockResolvedValueOnce({ toNumber: () => 0.5 }),
    };

    const result = await convertCurrency(walletMock as unknown as Wallet, 'ACA', 'DOT', 100);
    expect(result).toBe(400);
  });

  it('should throw an error if unable to fetch price for other currency', async () => {
    const walletMock = {
      getPrice: vi
        .fn()
        .mockResolvedValueOnce({ toNumber: () => 2 })
        .mockResolvedValueOnce({ toNumber: () => 0 }),
    };

    await expect(
      convertCurrency(walletMock as unknown as Wallet, 'ACA', 'DOT', 100),
    ).rejects.toThrow('Could not fetch price for DOT');
  });
});
