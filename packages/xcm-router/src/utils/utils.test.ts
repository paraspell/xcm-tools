// Unit tests for general utils

import { describe, it, expect } from 'vitest';
import { type Extrinsic } from '@paraspell/sdk-pjs';
import { calculateTxFee } from '.';
import BigNumber from 'bignumber.js';

interface RuntimeDispatchInfoMock {
  partialFee: { toString: () => string };
}

class MockExtrinsic {
  paymentInfo = async (_address: string): Promise<RuntimeDispatchInfoMock> =>
    Promise.resolve({
      partialFee: { toString: () => '1000' },
    });
}

describe('calculateTxFee', () => {
  it('should return the correct transaction fee', async () => {
    const mockTx = new MockExtrinsic();
    const address = 'mockAddress';

    const fee = await calculateTxFee(mockTx as Extrinsic, address);

    expect(fee).toBeInstanceOf(BigNumber);
    expect(fee.toString()).toBe('1000');
  });
});
