import { describe, it, expect, vi } from 'vitest'
import type { IPolkadotApi } from '../../api'
import { getParaEthTransferFees } from './getParaEthTransferFees'

describe('getParaEthTransferFees', () => {
  it('uses default fee when storage is 0x00000000', async () => {
    const mockAhApi = {
      getFromStorage: vi.fn().mockResolvedValueOnce('0x00000000'),
      disconnect: vi.fn().mockResolvedValueOnce(undefined)
    } as unknown as IPolkadotApi<unknown, unknown>

    const spy = vi.spyOn(mockAhApi, 'disconnect')
    const [transferBridgeFee, transferAssethubExecutionFee] =
      await getParaEthTransferFees(mockAhApi)
    expect(transferBridgeFee).toBe(3025959750000n)
    expect(transferAssethubExecutionFee).toBe(2420000000n)
    expect(spy).toHaveBeenCalled()
  })

  it('uses storage fee when storage is a valid non-zero hex', async () => {
    const mockAhApi = {
      getFromStorage: vi.fn().mockResolvedValueOnce('0x01000000'),
      disconnect: vi.fn().mockResolvedValueOnce(undefined)
    } as unknown as IPolkadotApi<unknown, unknown>

    const spy = vi.spyOn(mockAhApi, 'disconnect')
    const [transferBridgeFee, transferAssethubExecutionFee] =
      await getParaEthTransferFees(mockAhApi)
    expect(transferBridgeFee).toBe(1n)
    expect(transferAssethubExecutionFee).toBe(2420000000n)
    expect(spy).toHaveBeenCalled()
  })

  it('handles an empty string - empty storage response', async () => {
    const mockAhApi = {
      getFromStorage: vi.fn().mockResolvedValueOnce('0x'),
      disconnect: vi.fn().mockResolvedValueOnce(undefined)
    } as unknown as IPolkadotApi<unknown, unknown>

    const spy = vi.spyOn(mockAhApi, 'disconnect')
    const [transferBridgeFee, transferAssethubExecutionFee] =
      await getParaEthTransferFees(mockAhApi)
    expect(transferBridgeFee).toBe(3025959750000n)
    expect(transferAssethubExecutionFee).toBe(2420000000n)
    expect(spy).toHaveBeenCalled()
  })
})
