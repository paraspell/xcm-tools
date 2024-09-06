import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApiInstanceForNode } from '../../../utils'
import { getNativeAssetSymbol } from '../assets'
import { getAssetBalance } from './getAssetBalance'
import { ApiPromise } from '@polkadot/api'
import { getBalanceNative } from './getBalanceNative'
import { getBalanceForeign } from './getBalanceForeign'

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
  let apiMock: ApiPromise

  beforeEach(() => {
    apiMock = {} as unknown as ApiPromise
    vi.mocked(createApiInstanceForNode).mockResolvedValue(apiMock)
  })

  it('returns the native asset balance when the currency symbol matches the native symbol', async () => {
    const account = '0x123'
    const node = 'Polkadot'
    const currency = { symbol: 'DOT' }
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getBalanceNative).mockResolvedValue(BigInt(1000))

    const result = await getAssetBalance(account, node, currency)
    expect(result).toEqual(BigInt(1000))
    expect(getBalanceNative).toHaveBeenCalledWith(account, node, apiMock)
  })

  it('returns the foreign asset balance when the currency symbol does not match the native symbol', async () => {
    const account = '0x456'
    const node = 'Kusama'
    const currency = { symbol: 'KSM' }
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getBalanceForeign).mockResolvedValue(BigInt(200))

    const result = await getAssetBalance(account, node, currency)
    expect(result).toEqual(BigInt(200))
    expect(getBalanceForeign).toHaveBeenCalledWith(account, node, currency, apiMock)
  })

  it('returns zero when the foreign asset balance is null', async () => {
    const account = '0x789'
    const node = 'Kusama'
    const currency = { symbol: 'XYZ' }
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getBalanceForeign).mockResolvedValue(null)

    const result = await getAssetBalance(account, node, currency)
    expect(result).toEqual(BigInt(0))
  })

  it('handles errors when API creation fails', async () => {
    const account = '0x789'
    const node = 'Kusama'
    const currency = { symbol: 'XYZ' }
    vi.mocked(createApiInstanceForNode).mockRejectedValue(new Error('API creation failed'))

    await expect(getAssetBalance(account, node, currency)).rejects.toThrow('API creation failed')
  })
})
