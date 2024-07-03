/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Unit tests for main entry point functions

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transfer } from './transfer';
import { MOCK_TRANSFER_OPTIONS } from '../utils/utils.test';
import { TransactionType } from '../types';
import * as submitTransaction from '../utils/submitTransaction';

describe('transfer - integration', () => {
  let options: any;

  beforeEach(() => {
    options = {
      ...MOCK_TRANSFER_OPTIONS,
      from: 'Kusama',
      to: 'Robonomics',
      currencyFrom: 'KSM',
      currencyTo: 'XRT',
      type: TransactionType.FULL_TRANSFER,
    };

    vi.spyOn(submitTransaction, 'submitTransaction').mockResolvedValue('hash');
  });

  it('main transfer function - FULL_TRANSFER scenario - manual exchange', async () => {
    options.exchange = 'BasiliskDex';
    await expect(transfer(options)).resolves.not.toThrow();
  });

  it('main transfer function - FULL_TRANSFER scenario - auto exchange', async () => {
    options.exchange = undefined;
    await expect(transfer(options)).resolves.not.toThrow();
  });
});
