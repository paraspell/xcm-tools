import { describe, it, expect, vi } from 'vitest'
import { calculateFee } from './calculateFee'
import type { IPolkadotApi } from '../../api'

describe('calculateFee', () => {
  it('uses default fee when storage is 0x00000000', async () => {
    const mockAhApi = {
      getFromStorage: vi.fn().mockResolvedValueOnce('0x00000000'),
      disconnect: vi.fn().mockResolvedValueOnce(undefined)
    } as unknown as IPolkadotApi<unknown, unknown>

    const spy = vi.spyOn(mockAhApi, 'disconnect')
    const result = await calculateFee(mockAhApi)
    expect(result).toBe('3028379750000')
    expect(spy).toHaveBeenCalled()
  })

  it('uses storage fee when storage is a valid non-zero hex', async () => {
    const mockAhApi = {
      getFromStorage: vi.fn().mockResolvedValueOnce('0x01000000'),
      disconnect: vi.fn().mockResolvedValueOnce(undefined)
    } as unknown as IPolkadotApi<unknown, unknown>

    const spy = vi.spyOn(mockAhApi, 'disconnect')
    const result = await calculateFee(mockAhApi)
    expect(result).toBe('2420000001')
    expect(spy).toHaveBeenCalled()
  })

  it('handles an empty string - empty storage response', async () => {
    const mockAhApi = {
      getFromStorage: vi.fn().mockResolvedValueOnce('0x'),
      disconnect: vi.fn().mockResolvedValueOnce(undefined)
    } as unknown as IPolkadotApi<unknown, unknown>

    const spy = vi.spyOn(mockAhApi, 'disconnect')
    const result = await calculateFee(mockAhApi)
    expect(result).toBe('3028379750000')
    expect(spy).toHaveBeenCalled()
  })
})
