// Unit tests for general utils

import { describe, it, expect } from 'vitest';
import { type Extrinsic } from '@paraspell/sdk-pjs';
import { calculateTransactionFee } from './utils';
import BigNumber from 'bignumber.js';

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
