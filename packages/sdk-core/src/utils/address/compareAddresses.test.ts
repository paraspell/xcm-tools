import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { compareAddresses } from './compareAddresses'

describe('compareAddresses', () => {
  const mockApi = {
    accountToHex: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when addresses convert to the same hex', () => {
    const spy = vi.spyOn(mockApi, 'accountToHex')

    spy.mockImplementation(addr => {
      if (addr === 'addr1' || addr === 'addr2') return '0xdeadbeef'
      return '0xother'
    })

    const result = compareAddresses(mockApi, 'addr1', 'addr2')
    expect(result).toBe(true)
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenCalledWith('addr1')
    expect(spy).toHaveBeenCalledWith('addr2')
  })

  it('returns false when addresses convert to different hex', () => {
    vi.spyOn(mockApi, 'accountToHex').mockImplementation(addr =>
      addr === 'addr1' ? '0x123' : '0x456'
    )

    const result = compareAddresses(mockApi, 'addr1', 'addr2')
    expect(result).toBe(false)
  })
})
