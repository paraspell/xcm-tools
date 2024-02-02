// Unit tests for main entry point functions

import { describe, it, expect, vi } from 'vitest';
import { transfer } from './transfer';
import { MOCK_TRANSFER_OPTIONS } from '../utils/utils.test';
import { TransactionType, type TTransferOptions } from '../types';
import * as submitTransaction from '../utils/submitTransaction';

describe('transfer - integration', () => {
  it('main transfer function - FULL_TRANSFER scenario - manual exchange', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: 'BasiliskDex',
      from: 'Kusama',
      to: 'Robonomics',
      currencyFrom: 'KSM',
      currencyTo: 'XRT',
      type: TransactionType.FULL_TRANSFER,
    };
    vi.spyOn(submitTransaction, 'submitTransaction').mockResolvedValue('hash');
    await expect(transfer(options)).resolves.not.toThrow();
  });

  it('main transfer function - FULL_TRANSFER scenario - auto exchange', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: undefined,
      from: 'Kusama',
      to: 'Robonomics',
      currencyFrom: 'KSM',
      currencyTo: 'XRT',
      type: TransactionType.FULL_TRANSFER,
    };
    vi.spyOn(submitTransaction, 'submitTransaction').mockResolvedValue('hash');
    await expect(transfer(options)).resolves.not.toThrow();
  });
});
