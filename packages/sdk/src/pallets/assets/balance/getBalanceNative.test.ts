import { describe, it, expect, vi } from 'vitest'
import { getBalanceNative } from './getBalanceNative'
import type { ApiPromise } from '@polkadot/api'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import type { Extrinsic } from '../../../pjs/types'

vi.mock('../../../utils', () => ({
  createApiInstanceForNode: vi.fn()
}))

describe('getBalanceNative', () => {
  const apiMock = {
    init: vi.fn(),
    getBalanceNative: vi.fn()
  } as unknown as IPolkadotApi<ApiPromise, Extrinsic>

  it('returns the correct balance when API is provided', async () => {
    const address = '0x123'
    const node = 'Polkadot'
    const apiMock = {
      init: vi.fn(),
      getBalanceNative: vi.fn().mockResolvedValue(BigInt(1000))
    } as unknown as IPolkadotApi<ApiPromise, Extrinsic>

    const balance = await getBalanceNative({
      address,
      node,
      api: apiMock
    })
    expect(balance).toEqual(BigInt(1000))
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
