import { findAsset, getNativeAssetSymbol } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { DOT_MULTILOCATION } from '../../../constants'
import { createApiInstanceForNode } from '../../../utils'
import { getAssetBalance } from './getAssetBalance'
import { getBalanceForeignInternal } from './getBalanceForeign'
import { getBalanceNativeInternal } from './getBalanceNative'

vi.mock('../../../utils', () => ({
  createApiInstanceForNode: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  getNativeAssetSymbol: vi.fn(),
  findAsset: vi.fn(),
  InvalidCurrencyError: class extends Error {}
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
    vi.mocked(findAsset).mockReturnValueOnce({ symbol: 'DOT', multiLocation: DOT_MULTILOCATION })
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
    vi.mocked(findAsset).mockReturnValueOnce({ symbol: 'KSM', multiLocation: DOT_MULTILOCATION })
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
    vi.mocked(findAsset).mockReturnValueOnce({ symbol: 'XYZ', multiLocation: DOT_MULTILOCATION })
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getBalanceForeignInternal).mockResolvedValue(0n)

    const result = await getAssetBalance({ api: apiMock, address: account, node, currency })
    expect(result).toEqual(0n)
  })

  it('returns the correct balance when node is Interlay', async () => {
    const account = '0x234'
    const node = 'Interlay'
    const currency = { symbol: 'INTR' }
    vi.mocked(findAsset).mockReturnValueOnce({ symbol: 'INTR', multiLocation: DOT_MULTILOCATION })
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

  it('throws an error when the asset is not found', async () => {
    const account = '0x123'
    const node = 'Polkadot'
    const currency = { symbol: 'UNKNOWN' }
    vi.mocked(findAsset).mockReturnValueOnce(null)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')

    await expect(
      getAssetBalance({ api: apiMock, address: account, node, currency })
    ).rejects.toThrow('Asset {"symbol":"UNKNOWN"} not found on Polkadot')
  })
})
