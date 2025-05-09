import type { Extrinsic } from '@paraspell/sdk-pjs';
import BigNumber from 'bignumber.js';
import { describe, expect, it, vi } from 'vitest';

import { calculateTxFeePjs } from './calculateTxFeePjs';

describe('calculateTxFeePjs', () => {
  const dummyAddress = '5F3sa2TJAWMqDhXG6jhV4N8ko9Nhf86dF86Z8WfEsvajp1GD';

  it('returns a BigNumber wrapping the partialFee string', async () => {
    const tx = {
      paymentInfo: vi.fn().mockResolvedValue({
        partialFee: { toString: () => '1000' },
      }),
    } as unknown as Extrinsic;

    const spy = vi.spyOn(tx, 'paymentInfo');

    const fee = await calculateTxFeePjs(tx, dummyAddress);

    expect(spy).toHaveBeenCalledWith(dummyAddress);
    expect(fee).toBeInstanceOf(BigNumber);
    expect(fee.toString()).toBe('1000');
  });

  it('handles very large fees correctly', async () => {
    const largeString = '123456789012345678901234567890';
    const tx = {
      paymentInfo: vi.fn().mockResolvedValue({
        partialFee: { toString: () => largeString },
      }),
    } as unknown as Extrinsic;

    const fee = await calculateTxFeePjs(tx, dummyAddress);

    expect(fee.toFixed()).toBe(largeString);
    expect(fee.plus(1).toFixed()).toBe('123456789012345678901234567891');
  });

  it('propagates errors from paymentInfo', async () => {
    const error = new Error('network failure');
    const tx = {
      paymentInfo: vi.fn().mockRejectedValue(error),
    } as unknown as Extrinsic;

    await expect(calculateTxFeePjs(tx, dummyAddress)).rejects.toThrow('network failure');
  });
});
