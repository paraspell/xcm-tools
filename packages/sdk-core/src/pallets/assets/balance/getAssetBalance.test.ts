import { findAssetInfoOrThrow, getNativeAssetSymbol } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { DOT_LOCATION } from '../../../constants'
import { createChainClient } from '../../../utils'
import { getAssetBalance } from './getAssetBalance'
import { getBalanceForeignInternal } from './getBalanceForeign'
import { getBalanceNativeInternal } from './getBalanceNative'

vi.mock('../../../utils', () => ({
  createChainClient: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  getNativeAssetSymbol: vi.fn(),
  findAssetInfoOrThrow: vi.fn()
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
    vi.mocked(createChainClient).mockResolvedValue(apiMock)
  })

  it('returns the native asset balance when the currency symbol matches the native symbol', async () => {
    const account = '0x123'
    const chain = 'Polkadot'
    const currency = { symbol: 'DOT' }
    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce({
      symbol: 'DOT',
      location: DOT_LOCATION
    })
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(1000n)

    const result = await getAssetBalance({ api: apiMock, address: account, chain, currency })
    expect(result).toEqual(1000n)
    expect(getBalanceNativeInternal).toHaveBeenCalledWith({
      address: account,
      chain,
      api: apiMock
    })
  })

  it('returns the foreign asset balance when the currency symbol does not match the native symbol', async () => {
    const account = '0x456'
    const chain = 'Kusama'
    const currency = { symbol: 'KSM' }
    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce({
      symbol: 'KSM',
      location: DOT_LOCATION
    })
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getBalanceForeignInternal).mockResolvedValue(200n)

    const result = await getAssetBalance({ api: apiMock, address: account, chain, currency })
    expect(result).toEqual(200n)
    expect(getBalanceForeignInternal).toHaveBeenCalledWith({
      address: account,
      chain,
      currency,
      api: apiMock
    })
  })

  it('returns zero when the foreign asset balance is 0', async () => {
    const account = '0x789'
    const chain = 'Kusama'
    const currency = { symbol: 'XYZ' }
    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce({
      symbol: 'XYZ',
      location: DOT_LOCATION
    })
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getBalanceForeignInternal).mockResolvedValue(0n)

    const result = await getAssetBalance({ api: apiMock, address: account, chain, currency })
    expect(result).toEqual(0n)
  })

  it('returns the correct balance when chain is Interlay', async () => {
    const account = '0x234'
    const chain = 'Interlay'
    const currency = { symbol: 'INTR' }
    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce({
      symbol: 'INTR',
      location: DOT_LOCATION
    })
    vi.mocked(getNativeAssetSymbol).mockReturnValue('INTR')
    vi.mocked(getBalanceForeignInternal).mockResolvedValue(1500n)

    const result = await getAssetBalance({ api: apiMock, address: account, chain, currency })
    expect(result).toEqual(1500n)
    expect(getBalanceForeignInternal).toHaveBeenCalledWith({
      address: account,
      chain,
      currency,
      api: apiMock
    })
  })
})
