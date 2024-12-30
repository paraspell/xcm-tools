import { describe, it, expect, vi } from 'vitest'
import { getBalanceNative } from './getBalanceNative'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { getBalanceForeignInternal } from './getBalanceForeign'

vi.mock('../../../utils', () => ({
  createApiInstanceForNode: vi.fn()
}))

vi.mock('./getBalanceForeign', () => ({
  getBalanceForeignInternal: vi.fn()
}))

describe('getBalanceNative', () => {
  const apiMock = {
    init: vi.fn(),
    getBalanceNative: vi.fn(),
    disconnect: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  it('returns the correct balance when API is provided', async () => {
    const address = '0x123'
    const node = 'Polkadot'

    vi.spyOn(apiMock, 'getBalanceNative').mockResolvedValue(1000n)

    const balance = await getBalanceNative({
      address,
      node,
      api: apiMock
    })
    expect(balance).toEqual(1000n)
  })

  it('returns the correct balance when node is Interlay', async () => {
    const address = '0x234'
    const node = 'Interlay'

    vi.mocked(getBalanceForeignInternal).mockResolvedValue(1500n)

    const balance = await getBalanceNative({
      address,
      node,
      api: apiMock
    })
    expect(balance).toEqual(1500n)
    expect(getBalanceForeignInternal).toHaveBeenCalled()
  })

  it('returns the correct balance using a fallback API when no API is provided', async () => {
    const address = '0x456'
    const node = 'Kusama'

    vi.spyOn(apiMock, 'getBalanceNative').mockResolvedValue(2000n)
    const initSpy = vi.spyOn(apiMock, 'init')

    const balance = await getBalanceNative({
      address,
      node,
      api: apiMock
    })
    expect(balance).toEqual(2000n)
    expect(initSpy).toHaveBeenCalledWith(node)
  })

  it('handles errors gracefully when API call fails', async () => {
    const address = '0x789'
    const node = 'Kusama'

    vi.spyOn(apiMock, 'getBalanceNative').mockRejectedValue(new Error('API error'))

    await expect(
      getBalanceNative({
        address,
        node,
        api: apiMock
      })
    ).rejects.toThrow('API error')
  })
})
