import { describe, it, expect, vi } from 'vitest'
import { BN } from '@polkadot/util'
import type { Extrinsic } from '../../types'
import { calculateTransactionFee } from './calculateTransactionFee'

describe('calculateTransactionFee', () => {
  it('should correctly calculate the transaction fee', async () => {
    const address = 'test-address'
    const mockPartialFee = new BN(1000) // Example fee

    const mockTx = {
      paymentInfo: vi.fn().mockResolvedValue({
        partialFee: {
          toBn: () => mockPartialFee
        }
      })
    } as unknown as Extrinsic

    const result = await calculateTransactionFee(mockTx, address)
    expect(result).toBeInstanceOf(BN)
    expect(result.toNumber()).toBe(mockPartialFee.toNumber())
  })

  it('should handle errors thrown by paymentInfo', async () => {
    const address = 'test-address'
    const mockTx = {
      paymentInfo: vi.fn().mockRejectedValue(new Error('Failed to retrieve payment info'))
    } as unknown as Extrinsic

    await expect(calculateTransactionFee(mockTx, address)).rejects.toThrow(
      'Failed to retrieve payment info'
    )
  })
})
