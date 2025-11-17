import { findAssetInfoOrThrow, getNativeAssetSymbol } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { DOT_LOCATION } from '../../../constants'
import { createChainClient } from '../../../utils'
import { getAssetBalance } from './getAssetBalance'
import { getBalanceForeign } from './getBalanceForeign'
import { getBalanceNative } from './getBalanceNative'

vi.mock('@paraspell/assets')

vi.mock('../../../utils')
vi.mock('./getBalanceNative')
vi.mock('./getBalanceForeign')

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
      decimals: 10,
      location: DOT_LOCATION
    })
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getBalanceNative).mockResolvedValue(1000n)

    const result = await getAssetBalance({ api: apiMock, address: account, chain, currency })
    expect(result).toEqual(1000n)
    expect(getBalanceNative).toHaveBeenCalledWith({
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
      decimals: 12,
      location: DOT_LOCATION
    })
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getBalanceForeign).mockResolvedValue(200n)

    const result = await getAssetBalance({ api: apiMock, address: account, chain, currency })
    expect(result).toEqual(200n)
    expect(getBalanceForeign).toHaveBeenCalledWith({
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
      decimals: 12,
      location: DOT_LOCATION
    })
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getBalanceForeign).mockResolvedValue(0n)

    const result = await getAssetBalance({ api: apiMock, address: account, chain, currency })
    expect(result).toEqual(0n)
  })

  it('returns the correct balance when chain is Interlay', async () => {
    const account = '0x234'
    const chain = 'Interlay'
    const currency = { symbol: 'INTR' }
    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce({
      symbol: 'INTR',
      decimals: 10,
      location: DOT_LOCATION
    })
    vi.mocked(getNativeAssetSymbol).mockReturnValue('INTR')
    vi.mocked(getBalanceForeign).mockResolvedValue(1500n)

    const result = await getAssetBalance({ api: apiMock, address: account, chain, currency })
    expect(result).toEqual(1500n)
    expect(getBalanceForeign).toHaveBeenCalledWith({
      address: account,
      chain,
      currency,
      api: apiMock
    })
  })
})
