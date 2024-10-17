import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApiInstanceForNode } from '../../../utils'
import { getNativeAssetSymbol } from '../assets'
import { getAssetBalance } from './getAssetBalance'
import type { ApiPromise } from '@polkadot/api'
import { getBalanceNative } from './getBalanceNative'
import { getBalanceForeign } from './getBalanceForeign'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import type { Extrinsic } from '../../../pjs/types'

vi.mock('../../../utils', () => ({
  createApiInstanceForNode: vi.fn()
}))

vi.mock('../assets', () => ({
  getNativeAssetSymbol: vi.fn()
}))

vi.mock('./getBalanceNative', () => ({
  getBalanceNative: vi.fn()
}))

vi.mock('./getBalanceForeign', () => ({
  getBalanceForeign: vi.fn()
}))

describe('getAssetBalance', () => {
  let apiMock: IPolkadotApi<ApiPromise, Extrinsic>

  beforeEach(() => {
    apiMock = {
      init: vi.fn()
    } as unknown as IPolkadotApi<ApiPromise, Extrinsic>
    vi.mocked(createApiInstanceForNode).mockResolvedValue(apiMock)
  })

  it('returns the native asset balance when the currency symbol matches the native symbol', async () => {
    const account = '0x123'
    const node = 'Polkadot'
    const currency = { symbol: 'DOT' }
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getBalanceNative).mockResolvedValue(BigInt(1000))

    const result = await getAssetBalance({ api: apiMock, address: account, node, currency })
    expect(result).toEqual(BigInt(1000))
    expect(getBalanceNative).toHaveBeenCalledWith({ address: account, node, api: apiMock })
  })

  it('returns the foreign asset balance when the currency symbol does not match the native symbol', async () => {
    const account = '0x456'
    const node = 'Kusama'
    const currency = { symbol: 'KSM' }
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getBalanceForeign).mockResolvedValue(BigInt(200))

    const result = await getAssetBalance({ api: apiMock, address: account, node, currency })
    expect(result).toEqual(BigInt(200))
    expect(getBalanceForeign).toHaveBeenCalledWith({
      address: account,
      node,
      currency,
      api: apiMock
    })
  })

  it('returns zero when the foreign asset balance is null', async () => {
    const account = '0x789'
    const node = 'Kusama'
    const currency = { symbol: 'XYZ' }
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getBalanceForeign).mockResolvedValue(null)

    const result = await getAssetBalance({ api: apiMock, address: account, node, currency })
    expect(result).toEqual(BigInt(0))
  })
})
