import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { getBalanceForeignInternal } from './getBalanceForeign'
import { getBalanceNative } from './getBalanceNative'
import { getEthErc20Balance } from './getEthErc20Balance'

vi.mock('./getBalanceForeign', () => ({
  getBalanceForeignInternal: vi.fn()
}))

vi.mock('./getEthErc20Balance', () => ({
  getEthErc20Balance: vi.fn()
}))

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

  it('returns the correct balance when node is Polkadot', async () => {
    const spy = vi.spyOn(apiMock, 'getBalanceNative').mockResolvedValue(1000n)

    const balance = await getBalanceNative({
      address: '0x123',
      node: 'Polkadot',
      api: apiMock
    })

    expect(balance).toEqual(1000n)
    expect(spy).toHaveBeenCalled()
  })

  it('returns the correct balance when node is Interlay', async () => {
    vi.mocked(getBalanceForeignInternal).mockResolvedValue(1500n)

    const balance = await getBalanceNative({
      address: '0x234',
      node: 'Interlay',
      api: apiMock
    })

    expect(balance).toEqual(1500n)
    expect(getBalanceForeignInternal).toHaveBeenCalled()
  })

  it('returns the correct balance for Ethereum node', async () => {
    vi.mocked(getEthErc20Balance).mockResolvedValue(888n)

    const balance = await getBalanceNative({
      address: '0xETH',
      node: 'Ethereum',
      api: apiMock,
      currency: { symbol: 'ETH' }
    })

    expect(balance).toEqual(888n)
    expect(getEthErc20Balance).toHaveBeenCalledWith({ symbol: 'ETH' }, '0xETH')
  })

  it('throws when balance API call fails', async () => {
    vi.spyOn(apiMock, 'getBalanceNative').mockRejectedValue(new Error('API error'))

    await expect(
      getBalanceNative({
        address: '0xfail',
        node: 'Polkadot',
        api: apiMock
      })
    ).rejects.toThrow('API error')
  })
})
