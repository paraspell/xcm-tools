import { describe, it, expect, vi } from 'vitest';
import BigNumber from 'bignumber.js';
import { getTxWeight } from './getTxWeight';
import type { Extrinsic } from '@paraspell/sdk-pjs';

describe('getTxWeight', () => {
  it('should return correct weight values as BigNumber', async () => {
    const mockTx = {
      paymentInfo: vi.fn().mockResolvedValue({
        weight: {
          refTime: 1234,
          proofSize: 5678,
        },
      }),
    } as unknown as Extrinsic;
    const address = 'test-address';
    const spy = vi.spyOn(mockTx, 'paymentInfo');
    const result = await getTxWeight(mockTx, address);
    expect(spy).toHaveBeenCalledWith(address);
    expect(result.refTime.isEqualTo(new BigNumber(1234))).toBe(true);
    expect(result.proofSize.isEqualTo(new BigNumber(5678))).toBe(true);
  });

  it('should propagate error if tx.paymentInfo fails', async () => {
    const error = new Error('Payment info error');
    const mockTx = {
      paymentInfo: vi.fn().mockRejectedValue(error),
    } as unknown as Extrinsic;
    const address = 'test-address';
    await expect(getTxWeight(mockTx, address)).rejects.toThrow('Payment info error');
  });
});
