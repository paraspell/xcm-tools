import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getBalanceNative } from './getBalanceNative'
import { createApiInstanceForNode } from '../../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import type { Extrinsic } from '../../../pjs/types'

vi.mock('../../../utils', () => ({
  createApiInstanceForNode: vi.fn()
}))

describe('getBalanceNative', () => {
  const apiMock = {} as unknown as IPolkadotApi<ApiPromise, Extrinsic>

  beforeEach(() => {
    vi.mocked(createApiInstanceForNode).mockResolvedValue(apiMock)
  })

  it('returns the correct balance when API is provided', async () => {
    const address = '0x123'
    const node = 'Polkadot'
    const apiMock = {} as unknown as IPolkadotApi<ApiPromise, Extrinsic>

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

    const balance = await getBalanceNative({
      address,
      node,
      api: apiMock
    })
    expect(balance).toEqual(BigInt(2000))
    expect(createApiInstanceForNode).toHaveBeenCalledWith(node)
  })

  it('handles errors gracefully when API call fails', async () => {
    const address = '0x789'
    const node = 'Kusama'
    // vi.mocked(apiMock.query.system.account).mockRejectedValue(new Error('API error'))

    await expect(
      getBalanceNative({
        address,
        node,
        api: apiMock
      })
    ).rejects.toThrow('API error')
  })
})
