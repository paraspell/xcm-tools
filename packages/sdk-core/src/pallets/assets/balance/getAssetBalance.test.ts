import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { createApiInstanceForNode } from '../../../utils'
import { getNativeAssetSymbol } from '../assets'
import { getAssetBalance } from './getAssetBalance'
import { getBalanceForeignInternal } from './getBalanceForeign'
import { getBalanceNativeInternal } from './getBalanceNative'

vi.mock('../../../utils', () => ({
  createApiInstanceForNode: vi.fn()
}))

vi.mock('../assets', () => ({
  getNativeAssetSymbol: vi.fn()
}))

vi.mock('./getBalanceNative', () => ({
  getBalanceNativeInternal: vi.fn()
}))

vi.mock('./getBalanceForeign', () => ({
  getBalanceForeignInternal: vi.fn()
}))

describe('getAssetBalance', () => {
  let apiMock: IPolkadotApi<unknown, unknown>

  beforeEach(() => {
    apiMock = {
      init: vi.fn(),
      disconnect: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>
    vi.mocked(createApiInstanceForNode).mockResolvedValue(apiMock)
  })

  it('returns the native asset balance when the currency symbol matches the native symbol', async () => {
    const account = '0x123'
    const node = 'Polkadot'
    const currency = { symbol: 'DOT' }
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(1000n)

    const result = await getAssetBalance({ api: apiMock, address: account, node, currency })
    expect(result).toEqual(1000n)
    expect(getBalanceNativeInternal).toHaveBeenCalledWith({ address: account, node, api: apiMock })
  })

  it('returns the foreign asset balance when the currency symbol does not match the native symbol', async () => {
    const account = '0x456'
    const node = 'Kusama'
    const currency = { symbol: 'KSM' }
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getBalanceForeignInternal).mockResolvedValue(200n)

    const result = await getAssetBalance({ api: apiMock, address: account, node, currency })
    expect(result).toEqual(200n)
    expect(getBalanceForeignInternal).toHaveBeenCalledWith({
      address: account,
      node,
      currency,
      api: apiMock
    })
  })

  it('returns zero when the foreign asset balance is 0', async () => {
    const account = '0x789'
    const node = 'Kusama'
    const currency = { symbol: 'XYZ' }
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getBalanceForeignInternal).mockResolvedValue(0n)

    const result = await getAssetBalance({ api: apiMock, address: account, node, currency })
    expect(result).toEqual(0n)
  })

  it('returns the correct balance when node is Interlay', async () => {
    const account = '0x234'
    const node = 'Interlay'
    const currency = { symbol: 'INTR' }
    vi.mocked(getNativeAssetSymbol).mockReturnValue('INTR')
    vi.mocked(getBalanceForeignInternal).mockResolvedValue(1500n)

    const result = await getAssetBalance({ api: apiMock, address: account, node, currency })
    expect(result).toEqual(1500n)
    expect(getBalanceForeignInternal).toHaveBeenCalledWith({
      address: account,
      node,
      currency,
      api: apiMock
    })
  })
})
