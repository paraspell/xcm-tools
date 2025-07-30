import type { TChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidCurrencyError } from '../errors'
import type { TAssetInfo, TCurrencyCore } from '../types'
import { getNativeAssetSymbol } from './assets'
import { getExistentialDeposit, getExistentialDepositOrThrow } from './getExistentialDeposit'
import { findAssetInfo, findAssetInfoOrThrow } from './search'

vi.mock('./assets', () => ({
  getNativeAssetSymbol: vi.fn()
}))

vi.mock('./search', () => ({
  findAssetInfo: vi.fn(),
  findAssetInfoOrThrow: vi.fn()
}))

describe('getExistentialDeposit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return the ED of native asset when currency is not provided and findAsset succeeds', () => {
    const chain: TChain = 'Acala'
    const nativeSymbol = 'ACA'
    const wrappedSymbol = { type: 'Native', value: nativeSymbol }
    const ed = 1000000000n

    vi.mocked(getNativeAssetSymbol).mockReturnValue(nativeSymbol)
    vi.mocked(findAssetInfo).mockReturnValue({
      symbol: nativeSymbol,
      existentialDeposit: ed.toString()
    } as TAssetInfo)

    const result = getExistentialDeposit(chain)

    expect(getNativeAssetSymbol).toHaveBeenCalledWith(chain)
    expect(findAssetInfo).toHaveBeenCalledWith(chain, { symbol: wrappedSymbol }, null)
    expect(result).toBe(ed)
  })

  it('should fallback to findAssetInfoOrThrow when currency is not provided and findAsset returns null', () => {
    const chain: TChain = 'Acala'
    const nativeSymbol = 'ACA'
    const wrappedSymbol = { type: 'Native', value: nativeSymbol }
    const ed = 1000000000n

    vi.mocked(getNativeAssetSymbol).mockReturnValue(nativeSymbol)
    vi.mocked(findAssetInfo).mockReturnValue(null)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: nativeSymbol,
      existentialDeposit: ed.toString()
    } as TAssetInfo)

    const result = getExistentialDeposit(chain)

    expect(findAssetInfo).toHaveBeenCalledWith(chain, { symbol: wrappedSymbol }, null)
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(chain, { symbol: nativeSymbol }, null)
    expect(result).toBe(ed)
  })

  it('should return null if currency is not provided and native asset has no ED', () => {
    const chain: TChain = 'Acala'
    const nativeSymbol = 'ACA'

    vi.mocked(getNativeAssetSymbol).mockReturnValue(nativeSymbol)
    vi.mocked(findAssetInfo).mockReturnValue({
      symbol: nativeSymbol
    } as TAssetInfo)

    const result = getExistentialDeposit(chain)
    expect(result).toBeNull()
  })

  it('should return the ED of the specified currency when currency is provided', () => {
    const chain: TChain = 'Karura'
    const currency: TCurrencyCore = { symbol: 'KSM' }
    const ed = 500000000n

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: 'KSM',
      assetId: '1',
      existentialDeposit: ed.toString()
    } as TAssetInfo)

    const result = getExistentialDeposit(chain, currency)

    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(chain, currency, null)
    expect(result).toBe(ed)
  })

  it('should return null if currency is provided but asset has no ED', () => {
    const chain: TChain = 'Karura'
    const currency: TCurrencyCore = { symbol: 'KSM' }

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: 'KSM'
    } as TAssetInfo)

    const result = getExistentialDeposit(chain, currency)
    expect(result).toBeNull()
  })
})

describe('getExistentialDepositOrThrow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw InvalidCurrencyError if ED is not found', () => {
    const chain: TChain = 'Acala'
    const currency: TCurrencyCore = { symbol: 'KSM' }

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: 'KSM'
    } as TAssetInfo)

    expect(() => getExistentialDepositOrThrow(chain, currency)).toThrow(InvalidCurrencyError)
    expect(() => getExistentialDepositOrThrow(chain, currency)).toThrow(
      `Existential deposit not found for currency ${JSON.stringify(currency)} on chain ${chain}.`
    )
  })

  it('should return the ED as BigInt if found', () => {
    const chain: TChain = 'Acala'
    const currency: TCurrencyCore = { symbol: 'ACA' }
    const ed = '1000000000'

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: 'ACA',
      existentialDeposit: ed
    } as TAssetInfo)

    const result = getExistentialDepositOrThrow(chain, currency)
    expect(result).toBe(BigInt(ed))
  })

  it('should return the ED as BigInt for native asset when no currency provided', () => {
    const chain: TChain = 'Acala'
    const nativeSymbol = 'ACA'
    const wrappedSymbol = 'Native(ACA)'
    const ed = '1000000000'

    vi.mocked(getNativeAssetSymbol).mockReturnValue(nativeSymbol)
    vi.mocked(findAssetInfo).mockReturnValue({
      symbol: wrappedSymbol,
      existentialDeposit: ed
    } as TAssetInfo)

    const result = getExistentialDepositOrThrow(chain)
    expect(result).toBe(BigInt(ed))
  })
})
