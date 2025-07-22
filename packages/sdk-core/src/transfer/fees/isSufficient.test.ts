import type { TAsset, TCurrencyCore, WithAmount } from '@paraspell/assets'
import {
  getExistentialDepositOrThrow,
  getNativeAssetSymbol,
  isSymbolMatch
} from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { getAssetBalance, getBalanceNativeInternal } from '../../pallets/assets'
import { isSufficientDestination, isSufficientOrigin } from './isSufficient'

vi.mock('@paraspell/assets', () => ({
  getExistentialDepositOrThrow: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
  isSymbolMatch: vi.fn()
}))

vi.mock('../../pallets/assets', () => ({
  getBalanceNativeInternal: vi.fn(),
  getAssetBalance: vi.fn()
}))

describe('isSufficientOrigin', () => {
  const mockApi = {} as IPolkadotApi<unknown, unknown>
  const origin = 'Acala'
  const destination = 'Astar'
  const senderAddress = 'Alice'
  const feeNative = 100n
  const currency = { amount: 50n } as WithAmount<TCurrencyCore>
  const asset = { symbol: 'ACA' } as TAsset

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getNativeAssetSymbol).mockImplementation(node => {
      if (node === 'Acala') return 'ACA'
      if (node === 'Astar') return 'ASTR'
      return 'DOT'
    })
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(50n)
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(1000n)
  })

  it('returns undefined when feeAsset is provided', async () => {
    const feeAsset = { symbol: 'DOT' } as TAsset
    const result = await isSufficientOrigin(
      mockApi,
      origin,
      destination,
      senderAddress,
      feeNative,
      currency,
      asset,
      feeAsset
    )
    expect(result).toBeUndefined()
  })

  it('returns true when native asset to both origin and destination with sufficient balance', async () => {
    vi.mocked(isSymbolMatch).mockReturnValue(true)

    const result = await isSufficientOrigin(
      mockApi,
      origin,
      destination,
      senderAddress,
      feeNative,
      currency,
      asset,
      undefined
    )

    expect(isSymbolMatch).toHaveBeenCalledWith('ACA', 'ACA')
    expect(isSymbolMatch).toHaveBeenCalledWith('ACA', 'ASTR')
    expect(getExistentialDepositOrThrow).toHaveBeenCalledWith(origin)
    expect(getBalanceNativeInternal).toHaveBeenCalledWith({
      api: mockApi,
      node: origin,
      address: senderAddress
    })
    expect(result).toBe(true)
  })

  it('returns false when native asset to both origin and destination with insufficient balance', async () => {
    vi.mocked(isSymbolMatch).mockReturnValue(true)
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(150n) // 150 - 50 - 100 - 50 = -50

    const result = await isSufficientOrigin(
      mockApi,
      origin,
      destination,
      senderAddress,
      feeNative,
      currency,
      asset,
      undefined
    )

    expect(result).toBe(false)
  })

  it('returns true when non-native asset with sufficient native and asset balances', async () => {
    vi.mocked(isSymbolMatch).mockImplementation((assetSymbol, nativeSymbol) => {
      return assetSymbol === nativeSymbol
    })
    vi.mocked(getAssetBalance).mockResolvedValue(200n)

    const nonNativeAsset = { symbol: 'USDT' } as TAsset
    const result = await isSufficientOrigin(
      mockApi,
      origin,
      destination,
      senderAddress,
      feeNative,
      currency,
      nonNativeAsset,
      undefined
    )

    expect(getAssetBalance).toHaveBeenCalledWith({
      api: mockApi,
      node: origin,
      address: senderAddress,
      currency
    })
    expect(getExistentialDepositOrThrow).toHaveBeenCalledWith(origin, currency)
    expect(result).toBe(true)
  })

  it('returns false when non-native asset with insufficient native balance', async () => {
    vi.mocked(isSymbolMatch).mockImplementation((assetSymbol, nativeSymbol) => {
      return assetSymbol === nativeSymbol
    })
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(100n) // 100 - 50 - 100 = -50

    const nonNativeAsset = { symbol: 'USDT' } as TAsset
    const result = await isSufficientOrigin(
      mockApi,
      origin,
      destination,
      senderAddress,
      feeNative,
      currency,
      nonNativeAsset,
      undefined
    )

    expect(result).toBe(false)
  })

  it('returns false when non-native asset with insufficient asset balance', async () => {
    vi.mocked(isSymbolMatch).mockImplementation((assetSymbol, nativeSymbol) => {
      return assetSymbol === nativeSymbol
    })
    vi.mocked(getAssetBalance).mockResolvedValue(30n) // 30 - 50 = -20

    const nonNativeAsset = { symbol: 'USDT' } as TAsset
    const result = await isSufficientOrigin(
      mockApi,
      origin,
      destination,
      senderAddress,
      feeNative,
      currency,
      nonNativeAsset,
      undefined
    )

    expect(result).toBe(false)
  })

  it('handles native asset to origin only case', async () => {
    vi.mocked(isSymbolMatch).mockImplementation((_assetSymbol, nativeSymbol) => {
      if (nativeSymbol === 'ACA') return true
      return false
    })

    const result = await isSufficientOrigin(
      mockApi,
      origin,
      destination,
      senderAddress,
      feeNative,
      currency,
      asset,
      undefined
    )

    expect(result).toBe(true)
  })
})

describe('isSufficientDestination', () => {
  const mockApi = {} as IPolkadotApi<unknown, unknown>
  const destination = 'Astar'
  const address = 'Bob'
  const amount = 100n
  const feeNative = 50n
  const asset = { symbol: 'ASTR' } as TAsset

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ASTR')
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(30n)
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(200n)
  })

  it('returns undefined when asset is not native to destination', async () => {
    vi.mocked(isSymbolMatch).mockReturnValue(false)

    const nonNativeAsset = { symbol: 'USDT' } as TAsset
    const result = await isSufficientDestination(
      mockApi,
      destination,
      address,
      amount,
      nonNativeAsset,
      feeNative
    )

    expect(isSymbolMatch).toHaveBeenCalledWith('USDT', 'ASTR')
    expect(result).toBeUndefined()
  })

  it('returns true when native asset with sufficient balance', async () => {
    vi.mocked(isSymbolMatch).mockReturnValue(true)

    const result = await isSufficientDestination(
      mockApi,
      destination,
      address,
      amount,
      asset,
      feeNative
    )

    expect(isSymbolMatch).toHaveBeenCalledWith('ASTR', 'ASTR')
    expect(getExistentialDepositOrThrow).toHaveBeenCalledWith(destination)
    expect(getBalanceNativeInternal).toHaveBeenCalledWith({
      api: mockApi,
      node: destination,
      address: address
    })
    // 200 + 100 - 30 - 50 = 220 > 0
    expect(result).toBe(true)
  })

  it('returns false when native asset with insufficient balance', async () => {
    vi.mocked(isSymbolMatch).mockReturnValue(true)
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(50n)
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(200n)

    const result = await isSufficientDestination(
      mockApi,
      destination,
      address,
      amount,
      asset,
      feeNative
    )

    // 50 + 100 - 200 - 50 = -100 <= 0
    expect(result).toBe(false)
  })

  it('handles edge case where balance + amount equals existential deposit + fee', async () => {
    vi.mocked(isSymbolMatch).mockReturnValue(true)
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(30n)
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(50n)

    const result = await isSufficientDestination(
      mockApi,
      destination,
      address,
      20n,
      asset,
      feeNative
    )

    // 30 + 20 - 50 - 50 = -50 <= 0
    expect(result).toBe(false)
  })
})
