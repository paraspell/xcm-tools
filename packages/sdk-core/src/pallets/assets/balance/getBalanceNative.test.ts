import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { getBalanceNative } from './getBalanceNative'

describe('getBalanceNative', () => {
  const apiMock = {
    init: vi.fn(),
    getBalanceNative: vi.fn(),
    getBalanceNativeAcala: vi.fn(),
    disconnect: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the correct balance when chain is Polkadot', async () => {
    const spy = vi.spyOn(apiMock, 'getBalanceNative').mockResolvedValue(1000n)

    const balance = await getBalanceNative({
      address: '0x123',
      chain: 'Polkadot',
      api: apiMock
    })

    expect(balance).toEqual(1000n)
    expect(spy).toHaveBeenCalled()
  })

  it('throws when balance API call fails', async () => {
    vi.spyOn(apiMock, 'getBalanceNative').mockRejectedValue(new Error('API error'))

    await expect(
      getBalanceNative({
        address: '0xfail',
        chain: 'Polkadot',
        api: apiMock
      })
    ).rejects.toThrow('API error')
  })
})
