import { describe, it, expect, vi } from 'vitest'
import { getBalanceNative } from './getBalanceNative'
import type { ApiPromise } from '@polkadot/api'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import type { Extrinsic } from '../../../pjs/types'
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
  } as unknown as IPolkadotApi<ApiPromise, Extrinsic>

  it('returns the correct balance when API is provided', async () => {
    const address = '0x123'
    const node = 'Polkadot'

    vi.spyOn(apiMock, 'getBalanceNative').mockResolvedValue(BigInt(1000))

    const balance = await getBalanceNative({
      address,
      node,
      api: apiMock
    })
    expect(balance).toEqual(BigInt(1000))
  })

  it('returns the correct balance when node is Interlay', async () => {
    const address = '0x234'
    const node = 'Interlay'

    vi.mocked(getBalanceForeignInternal).mockResolvedValue(BigInt(1500))

    const balance = await getBalanceNative({
      address,
      node,
      api: apiMock
    })
    expect(balance).toEqual(BigInt(1500))
    expect(getBalanceForeignInternal).toHaveBeenCalled()
  })

  it('returns the correct balance using a fallback API when no API is provided', async () => {
    const address = '0x456'
    const node = 'Kusama'

    vi.spyOn(apiMock, 'getBalanceNative').mockResolvedValue(BigInt(2000))
    const initSpy = vi.spyOn(apiMock, 'init')

    const balance = await getBalanceNative({
      address,
      node,
      api: apiMock
    })
    expect(balance).toEqual(BigInt(2000))
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
