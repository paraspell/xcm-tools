import type { TChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidCurrencyError } from '../errors'
import type { TAssetInfo, TCurrencyCore } from '../types'
import { getNativeAssetSymbol } from './assets'
import {
  getEdFromAssetOrThrow,
  getExistentialDeposit,
  getExistentialDepositOrThrow
} from './getExistentialDeposit'
import { findAssetInfo, findAssetInfoOrThrow } from './search'

vi.mock('./assets', () => ({ getNativeAssetSymbol: vi.fn() }))
vi.mock('./search')

describe('getExistentialDeposit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns ED of native asset when currency is not provided and findAssetInfo succeeds', () => {
    const chain: TChain = 'Acala'
    const nativeSymbol = 'ACA'
    const ed = 1_000_000_000n

    vi.mocked(getNativeAssetSymbol).mockReturnValue(nativeSymbol)
    vi.mocked(findAssetInfo).mockReturnValue({
      symbol: nativeSymbol,
      existentialDeposit: ed.toString()
    } as TAssetInfo)

    const result = getExistentialDeposit(chain)

    expect(getNativeAssetSymbol).toHaveBeenCalledWith(chain)
    expect(findAssetInfo).toHaveBeenCalledWith(
      chain,
      expect.objectContaining({ symbol: expect.anything() }),
      null
    )
    expect(result).toBe(ed)
  })

  it('falls back to findAssetInfoOrThrow when currency is not provided and findAssetInfo returns null', () => {
    const chain: TChain = 'Acala'
    const nativeSymbol = 'ACA'
    const ed = 1_000_000_000n

    vi.mocked(getNativeAssetSymbol).mockReturnValue(nativeSymbol)
    vi.mocked(findAssetInfo).mockReturnValue(null)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: nativeSymbol,
      existentialDeposit: ed.toString()
    } as TAssetInfo)

    const result = getExistentialDeposit(chain)

    expect(findAssetInfo).toHaveBeenCalledWith(
      chain,
      expect.objectContaining({ symbol: expect.anything() }),
      null
    )
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(chain, { symbol: nativeSymbol }, null)
    expect(result).toBe(ed)
  })

  it('returns null if currency is not provided and native asset has no ED', () => {
    const chain: TChain = 'Acala'
    const nativeSymbol = 'ACA'

    vi.mocked(getNativeAssetSymbol).mockReturnValue(nativeSymbol)
    vi.mocked(findAssetInfo).mockReturnValue({
      symbol: nativeSymbol
    } as TAssetInfo)

    const result = getExistentialDeposit(chain)
    expect(result).toBeNull()
  })

  it('returns ED of the specified currency when currency is provided', () => {
    const chain: TChain = 'Karura'
    const currency: TCurrencyCore = { symbol: 'KSM' }
    const ed = 500_000_000n

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: 'KSM',
      assetId: '1',
      existentialDeposit: ed.toString()
    } as TAssetInfo)

    const result = getExistentialDeposit(chain, currency)

    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(chain, currency, null)
    expect(result).toBe(ed)
  })

  it('returns null if currency is provided but asset has no ED', () => {
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
  beforeEach(() => vi.clearAllMocks())

  it('throws InvalidCurrencyError if ED is not found (with chain in message)', () => {
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

  it('returns ED as BigInt if found for a provided currency', () => {
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

  it('returns ED as BigInt for native asset when no currency provided', () => {
    const chain: TChain = 'Acala'
    const nativeSymbol = 'ACA'
    const ed = '1000000000'

    vi.mocked(getNativeAssetSymbol).mockReturnValue(nativeSymbol)
    vi.mocked(findAssetInfo).mockReturnValue({
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
