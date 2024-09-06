/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getBalanceNative } from './getBalanceNative'
import { createApiInstanceForNode } from '../../../utils'
import { ApiPromise } from '@polkadot/api'

vi.mock('../../../utils', () => ({
  createApiInstanceForNode: vi.fn()
}))

describe('getBalanceNative', () => {
  let apiMock: ApiPromise

  beforeEach(() => {
    apiMock = {
      query: {
        system: {
          account: vi.fn()
        }
      }
    } as unknown as ApiPromise
    vi.mocked(createApiInstanceForNode).mockResolvedValue(apiMock)
  })

  it('returns the correct balance when API is provided', async () => {
    const address = '0x123'
    const node = 'Polkadot'
    const mockBalance = { data: { free: { toBn: () => ({ toString: () => '1000' }) } } }
    vi.mocked(apiMock.query.system.account).mockResolvedValue(mockBalance as any)

    const balance = await getBalanceNative(address, node, apiMock)
    expect(balance).toEqual(BigInt(1000))
  })

  it('returns the correct balance using a fallback API when no API is provided', async () => {
    const address = '0x456'
    const node = 'Kusama'
    const mockBalance = { data: { free: { toBn: () => ({ toString: () => '2000' }) } } }
    vi.mocked(apiMock.query.system.account).mockResolvedValue(mockBalance as any)

    const balance = await getBalanceNative(address, node)
    expect(balance).toEqual(BigInt(2000))
    expect(createApiInstanceForNode).toHaveBeenCalledWith(node)
  })

  it('handles errors gracefully when API call fails', async () => {
    const address = '0x789'
    const node = 'Kusama'
    vi.mocked(apiMock.query.system.account).mockRejectedValue(new Error('API error'))

    await expect(getBalanceNative(address, node, apiMock)).rejects.toThrow('API error')
  })
})
