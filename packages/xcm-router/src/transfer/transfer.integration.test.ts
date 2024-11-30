import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transfer } from './transfer';
import { MOCK_TRANSFER_OPTIONS } from '../utils/utils.test';
import type { TTransferOptions } from '../types';
import { TransactionType } from '../types';
import * as submitTransaction from '../utils/submitTransaction';

describe('transfer - integration', () => {
  let options: TTransferOptions;

  beforeEach(() => {
    options = {
      ...MOCK_TRANSFER_OPTIONS,
      from: 'Kusama',
      to: 'RobonomicsKusama',
      currencyFrom: { symbol: 'KSM' },
      currencyTo: { symbol: 'XRT' },
      type: TransactionType.FULL_TRANSFER,
    };

    vi.spyOn(submitTransaction, 'submitTransaction').mockResolvedValue('hash');
  });

  it('main transfer function - FULL_TRANSFER scenario - manual exchange', async () => {
    options.exchange = 'KaruraDex';
    await expect(transfer(options)).resolves.not.toThrow();
  });

  it('main transfer function - FULL_TRANSFER scenario - auto exchange', async () => {
    options.exchange = undefined;
    await expect(transfer(options)).resolves.not.toThrow();
  });
});
