// Unit tests for general utils

import { type Extrinsic } from '@paraspell/sdk-pjs';
import BigNumber from 'bignumber.js';
import { describe, expect, it } from 'vitest';

import { calculateTxFee } from '.';

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
