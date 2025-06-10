import type { TNodeWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidCurrencyError } from '../errors'
import type { TAsset, TCurrencyCore } from '../types'
import { getNativeAssetSymbol } from './assets'
import { getExistentialDeposit, getExistentialDepositOrThrow } from './getExistentialDeposit'
import { findAsset, findAssetForNodeOrThrow } from './search'

vi.mock('./assets', () => ({
  getNativeAssetSymbol: vi.fn()
}))

vi.mock('./search', () => ({
  findAsset: vi.fn(),
  findAssetForNodeOrThrow: vi.fn()
}))

describe('getExistentialDeposit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return the ED of native asset when currency is not provided and findAsset succeeds', () => {
    const node: TNodeWithRelayChains = 'Acala'
    const nativeSymbol = 'ACA'
    const wrappedSymbol = { type: 'Native', value: nativeSymbol }
    const ed = '1000000000'

    vi.mocked(getNativeAssetSymbol).mockReturnValue(nativeSymbol)
    vi.mocked(findAsset).mockReturnValue({
      symbol: nativeSymbol,
      existentialDeposit: ed
    } as TAsset)

    const result = getExistentialDeposit(node)

    expect(getNativeAssetSymbol).toHaveBeenCalledWith(node)
    expect(findAsset).toHaveBeenCalledWith(node, { symbol: wrappedSymbol }, null)
    expect(result).toBe(ed)
  })

  it('should fallback to findAssetForNodeOrThrow when currency is not provided and findAsset returns null', () => {
    const node: TNodeWithRelayChains = 'Acala'
    const nativeSymbol = 'ACA'
    const wrappedSymbol = { type: 'Native', value: nativeSymbol }
    const ed = '1000000000'

    vi.mocked(getNativeAssetSymbol).mockReturnValue(nativeSymbol)
    vi.mocked(findAsset).mockReturnValue(null)
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({
      symbol: nativeSymbol,
      existentialDeposit: ed
    } as TAsset)

    const result = getExistentialDeposit(node)

    expect(findAsset).toHaveBeenCalledWith(node, { symbol: wrappedSymbol }, null)
    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(node, { symbol: nativeSymbol }, null)
    expect(result).toBe(ed)
  })

  it('should return null if currency is not provided and native asset has no ED', () => {
    const node: TNodeWithRelayChains = 'Acala'
    const nativeSymbol = 'ACA'

    vi.mocked(getNativeAssetSymbol).mockReturnValue(nativeSymbol)
    vi.mocked(findAsset).mockReturnValue({
      symbol: nativeSymbol
    } as TAsset)

    const result = getExistentialDeposit(node)
    expect(result).toBeNull()
  })

  it('should return the ED of the specified currency when currency is provided', () => {
    const node: TNodeWithRelayChains = 'Karura'
    const currency: TCurrencyCore = { symbol: 'KSM' }
    const ed = '500000000'

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({
      symbol: 'KSM',
      assetId: '1',
      existentialDeposit: ed
    } as TAsset)

    const result = getExistentialDeposit(node, currency)

    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(node, currency, null)
    expect(result).toBe(ed)
  })

  it('should return null if currency is provided but asset has no ED', () => {
    const node: TNodeWithRelayChains = 'Karura'
    const currency: TCurrencyCore = { symbol: 'KSM' }

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({
      symbol: 'KSM'
    } as TAsset)

    const result = getExistentialDeposit(node, currency)
    expect(result).toBeNull()
  })
})

describe('getExistentialDepositOrThrow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw InvalidCurrencyError if ED is not found', () => {
    const node: TNodeWithRelayChains = 'Acala'
    const currency: TCurrencyCore = { symbol: 'KSM' }

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({
      symbol: 'KSM'
    } as TAsset)

    expect(() => getExistentialDepositOrThrow(node, currency)).toThrow(InvalidCurrencyError)
    expect(() => getExistentialDepositOrThrow(node, currency)).toThrow(
      `Existential deposit not found for currency ${JSON.stringify(currency)} on node ${node}.`
    )
  })

  it('should return the ED as BigInt if found', () => {
    const node: TNodeWithRelayChains = 'Acala'
    const currency: TCurrencyCore = { symbol: 'ACA' }
    const ed = '1000000000'

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({
      symbol: 'ACA',
      existentialDeposit: ed
    } as TAsset)

    const result = getExistentialDepositOrThrow(node, currency)
    expect(result).toBe(BigInt(ed))
  })

  it('should return the ED as BigInt for native asset when no currency provided', () => {
    const node: TNodeWithRelayChains = 'Acala'
    const nativeSymbol = 'ACA'
    const wrappedSymbol = 'Native(ACA)'
    const ed = '1000000000'

    vi.mocked(getNativeAssetSymbol).mockReturnValue(nativeSymbol)
    vi.mocked(findAsset).mockReturnValue({
      symbol: wrappedSymbol,
      existentialDeposit: ed
    } as TAsset)

    const result = getExistentialDepositOrThrow(node)
    expect(result).toBe(BigInt(ed))
  })
})
