import type { TChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidCurrencyError } from '../errors'
import type { TAssetInfo, TCurrencyCore } from '../types'
import { getNativeAssetSymbolImpl } from './assets'
import {
  getEdFromAssetOrThrow,
  getExistentialDeposit,
  getExistentialDepositOrThrow
} from './getExistentialDeposit'
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

  it('returns null if currency is not provided and native asset has no ED', () => {
    const chain: TChain = 'Acala'
    const nativeSymbol = 'ACA'

    vi.mocked(getNativeAssetSymbolImpl).mockReturnValue(nativeSymbol)
    vi.mocked(findAssetInfoImpl).mockReturnValue({
      symbol: nativeSymbol
    } as TAssetInfo)

    const result = getExistentialDeposit(chain)
    expect(result).toBeNull()
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

  it('returns null if currency is provided but asset has no ED', () => {
    const chain: TChain = 'Karura'
    const currency: TCurrencyCore = { symbol: 'KSM' }

    vi.mocked(findAssetInfoOrThrowImpl).mockReturnValue({
      symbol: 'KSM'
    } as TAssetInfo)

    const result = getExistentialDeposit(chain, currency)
    expect(result).toBeNull()
  })
})

describe('getExistentialDepositOrThrow', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws InvalidCurrencyError if ED is not found (with chain in message)', () => {
    const chain: TChain = 'Acala'
    const currency: TCurrencyCore = { symbol: 'KSM' }

    vi.mocked(findAssetInfoOrThrowImpl).mockReturnValue({
      symbol: 'KSM'
    } as TAssetInfo)

    expect(() => getExistentialDepositOrThrow(chain, currency)).toThrow(InvalidCurrencyError)
    expect(() => getExistentialDepositOrThrow(chain, currency)).toThrow(
      `Existential deposit not found for currency ${JSON.stringify(currency)} on chain ${chain}.`
    )
  })

  it('returns ED as BigInt if found for a provided currency', () => {
    const chain: TChain = 'Acala'
    const currency: TCurrencyCore = { symbol: 'ACA' }
    const ed = '1000000000'

    vi.mocked(findAssetInfoOrThrowImpl).mockReturnValue({
      symbol: 'ACA',
      existentialDeposit: ed
    } as TAssetInfo)

    const result = getExistentialDepositOrThrow(chain, currency)
    expect(result).toBe(BigInt(ed))
  })

  it('returns ED as BigInt for native asset when no currency provided', () => {
    const chain: TChain = 'Acala'
    const nativeSymbol = 'ACA'
    const ed = '1000000000'

    vi.mocked(getNativeAssetSymbolImpl).mockReturnValue(nativeSymbol)
    vi.mocked(findAssetInfoImpl).mockReturnValue({
      symbol: nativeSymbol,
      existentialDeposit: ed
    } as TAssetInfo)

    const result = getExistentialDepositOrThrow(chain)
    expect(result).toBe(BigInt(ed))
  })
})

describe('getEdFromAssetOrThrow', () => {
  it('returns ED bigint from asset when present', () => {
    const asset: TAssetInfo = {
      symbol: 'DOT',
      existentialDeposit: '1000'
    } as TAssetInfo

    const ed = getEdFromAssetOrThrow(asset)
    expect(ed).toBe(1000n)
  })

  it('throws InvalidCurrencyError when asset has no ED', () => {
    const asset: TAssetInfo = { symbol: 'DOT' } as TAssetInfo
    expect(() => getEdFromAssetOrThrow(asset)).toThrow(InvalidCurrencyError)
  })

  it('supports large ED string -> BigInt conversion', () => {
    const big = '123456789012345678901234567890'
    const asset: TAssetInfo = { symbol: 'GLMR', existentialDeposit: big } as TAssetInfo
    expect(getEdFromAssetOrThrow(asset)).toBe(BigInt(big))
  })
})
