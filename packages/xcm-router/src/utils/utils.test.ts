// Unit tests for general utils

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { type Extrinsic, InvalidCurrencyError } from '@paraspell/sdk-pjs';
import {
  calculateTransactionFee,
  delay,
  maybeUpdateTransferStatus,
  validateRelayChainCurrency,
} from './utils';
import BigNumber from 'bignumber.js';
import { type TTxProgressInfo, TransactionStatus, TransactionType } from '../types';

describe('validateRelayChainCurrency', () => {
  it('should not throw an error for valid Polkadot currency', () => {
    expect(() => {
      validateRelayChainCurrency('Polkadot', { symbol: 'DOT' });
    }).not.toThrow();
  });

  it('should not throw an error for valid Kusama currency', () => {
    expect(() => {
      validateRelayChainCurrency('Kusama', { symbol: 'KSM' });
    }).not.toThrow();
  });

  it('should throw an InvalidCurrencyError for invalid Polkadot currency', () => {
    expect(() => {
      validateRelayChainCurrency('Polkadot', { symbol: 'XYZ' });
    }).toThrow(InvalidCurrencyError);
    expect(() => {
      validateRelayChainCurrency('Polkadot', { symbol: 'XYZ' });
    }).toThrow('Invalid currency for Polkadot');
  });

  it('should throw an InvalidCurrencyError for invalid Kusama currency', () => {
    expect(() => {
      validateRelayChainCurrency('Kusama', { symbol: 'XYZ' });
    }).toThrow(InvalidCurrencyError);
    expect(() => {
      validateRelayChainCurrency('Kusama', { symbol: 'XYZ' });
    }).toThrow('Invalid currency for Kusama');
  });
});

describe('delay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should wait for the specified amount of time', async () => {
    const ms = 1000;
    const promise = delay(ms);
    vi.advanceTimersByTime(ms);
    await expect(promise).resolves.toBeUndefined();
  });
});

interface RuntimeDispatchInfoMock {
  partialFee: { toString: () => string };
}

class MockExtrinsic {
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async paymentInfo(address: string): Promise<RuntimeDispatchInfoMock> {
    return { partialFee: { toString: () => '1000' } };
  }
}

describe('calculateTransactionFee', () => {
  it('should return the correct transaction fee', async () => {
    const mockTx = new MockExtrinsic();
    const address = 'mockAddress';

    const fee = await calculateTransactionFee(mockTx as Extrinsic, address);

    expect(fee).toBeInstanceOf(BigNumber);
    expect(fee.toString()).toBe('1000');
  });
});

describe('maybeUpdateTransferStatus', () => {
  it('should call onStatusChange with info when onStatusChange is provided', () => {
    const mockOnStatusChange = vi.fn();
    const mockInfo: TTxProgressInfo = {
      type: TransactionType.TO_EXCHANGE,
      hashes: {
        [TransactionType.TO_EXCHANGE]: 'mockHashToExchange',
        [TransactionType.SWAP]: 'mockHashSwap',
        [TransactionType.TO_DESTINATION]: 'mockHashFromExchange',
      },
      status: TransactionStatus.SUCCESS,
    };

    maybeUpdateTransferStatus(mockOnStatusChange, mockInfo);

    expect(mockOnStatusChange).toHaveBeenCalledTimes(1);
    expect(mockOnStatusChange).toHaveBeenCalledWith(mockInfo);
  });

  it('should not call onStatusChange when it is undefined', () => {
    const mockOnStatusChange = undefined;
    const mockInfo: TTxProgressInfo = {
      type: TransactionType.SWAP,
      status: TransactionStatus.IN_PROGRESS,
    };

    expect(() => {
      maybeUpdateTransferStatus(mockOnStatusChange, mockInfo);
    }).not.toThrow();
  });
});
