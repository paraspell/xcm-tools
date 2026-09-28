import type { TChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TAssetInfo, TCurrencyCore } from '../types'
import { getNativeAssetSymbolImpl } from './assets'
import { getExistentialDeposit } from './getExistentialDeposit'
import { findAssetInfoImpl, findAssetInfoOrThrowImpl } from './search'

vi.mock('./assets')
vi.mock('./search')

describe('getExistentialDeposit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns ED of native asset when currency is not provided and findAssetInfoImpl succeeds', () => {
    const chain: TChain = 'Acala'
    const nativeSymbol = 'ACA'
    const ed = 1_000_000_000n

    vi.mocked(getNativeAssetSymbolImpl).mockReturnValue(nativeSymbol)
    vi.mocked(findAssetInfoImpl).mockReturnValue({
      symbol: nativeSymbol,
      existentialDeposit: ed.toString()
    } as TAssetInfo)

    const result = getExistentialDeposit(chain)

    expect(getNativeAssetSymbolImpl).toHaveBeenCalledWith(chain, undefined)
    expect(findAssetInfoImpl).toHaveBeenCalledWith(
      chain,
      expect.objectContaining({ symbol: expect.anything() }),
      undefined,
      undefined
    )
    expect(result).toBe(ed)
  })

  it('falls back to findAssetInfoOrThrowImpl when currency is not provided and findAssetInfoImpl returns null', () => {
    const chain: TChain = 'Acala'
    const nativeSymbol = 'ACA'
    const ed = 1_000_000_000n

    vi.mocked(getNativeAssetSymbolImpl).mockReturnValue(nativeSymbol)
    vi.mocked(findAssetInfoImpl).mockReturnValue(null)
    vi.mocked(findAssetInfoOrThrowImpl).mockReturnValue({
      symbol: nativeSymbol,
      existentialDeposit: ed.toString()
    } as TAssetInfo)

    const result = getExistentialDeposit(chain)

    expect(findAssetInfoImpl).toHaveBeenCalledWith(
      chain,
      expect.objectContaining({ symbol: expect.anything() }),
      undefined,
      undefined
    )
    expect(findAssetInfoOrThrowImpl).toHaveBeenCalledWith(
      chain,
      { symbol: nativeSymbol },
      undefined,
      undefined
    )
    expect(result).toBe(ed)
  })

  it('returns ED of the specified currency when currency is provided', () => {
    const chain: TChain = 'Karura'
    const currency: TCurrencyCore = { symbol: 'KSM' }
    const ed = 500_000_000n

    vi.mocked(findAssetInfoOrThrowImpl).mockReturnValue({
      symbol: 'KSM',
      assetId: '1',
      existentialDeposit: ed.toString()
    } as TAssetInfo)

    const result = getExistentialDeposit(chain, currency)

    expect(findAssetInfoOrThrowImpl).toHaveBeenCalledWith(chain, currency, undefined, undefined)
    expect(result).toBe(ed)
  })
})
