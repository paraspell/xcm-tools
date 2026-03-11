import type { Extrinsic } from '@paraspell/sdk-pjs';
import { describe, expect, it, vi } from 'vitest';

import { calculateTxFeePjs } from './calculateTxFeePjs';

describe('calculateTxFeePjs', () => {
  const dummyAddress = '5F3sa2TJAWMqDhXG6jhV4N8ko9Nhf86dF86Z8WfEsvajp1GD';

  it('returns a BigNumber wrapping the partialFee string', async () => {
    const value = 1000n;
    const tx = {
      paymentInfo: vi.fn().mockResolvedValue({
        partialFee: { toBigInt: () => value },
      }),
    } as unknown as Extrinsic;

    const spy = vi.spyOn(tx, 'paymentInfo');

    const fee = await calculateTxFeePjs(tx, dummyAddress);

    expect(spy).toHaveBeenCalledWith(dummyAddress);
    expect(fee).toEqual(value);
  });

  it('propagates errors from paymentInfo', async () => {
    const error = new Error('network failure');
    const tx = {
      paymentInfo: vi.fn().mockRejectedValue(error),
    } as unknown as Extrinsic;

    await expect(calculateTxFeePjs(tx, dummyAddress)).rejects.toThrow('network failure');
  });
});
