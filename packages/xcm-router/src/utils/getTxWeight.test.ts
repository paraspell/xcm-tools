import type { Extrinsic } from '@paraspell/sdk-pjs';
import { describe, expect, it, vi } from 'vitest';

import { getTxWeight } from './getTxWeight';

describe('getTxWeight', () => {
  it('should return correct weight values as BigNumber', async () => {
    const mockTx = {
      paymentInfo: vi.fn().mockResolvedValue({
        weight: {
          refTime: {
            toBigInt: vi.fn().mockReturnValue(1234n),
          },
          proofSize: {
            toBigInt: vi.fn().mockReturnValue(5678n),
          },
        },
      }),
    } as unknown as Extrinsic;
    const address = 'test-address';
    const spy = vi.spyOn(mockTx, 'paymentInfo');
    const result = await getTxWeight(mockTx, address);
    expect(spy).toHaveBeenCalledWith(address);
    expect(result).toEqual({
      refTime: 1234n,
      proofSize: 5678n,
    });
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
