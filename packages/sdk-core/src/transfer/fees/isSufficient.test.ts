import type { TAssetInfo, TCurrencyCore, WithAmount } from '@paraspell/assets'
import {
  getEdFromAssetOrThrow,
  getExistentialDepositOrThrow,
  getNativeAssetSymbol,
  isSymbolMatch
} from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { getAssetBalanceInternal, getBalanceNative } from '../../balance'
import { isSufficientDestination, isSufficientOrigin } from './isSufficient'

vi.mock('@paraspell/assets')

vi.mock('../../pallets/assets/balance')
vi.mock('../../balance')

describe('isSufficientOrigin', () => {
  const mockApi = {} as IPolkadotApi<unknown, unknown>
  const origin = 'Acala'
  const destination = 'Astar'
  const senderAddress = 'Alice'
  const feeNative = 100n
  const currency = { amount: 50n } as WithAmount<TCurrencyCore>
  const asset = { symbol: 'ACA' } as TAssetInfo

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getNativeAssetSymbol).mockImplementation(chain => {
      if (chain === 'Acala') return 'ACA'
      if (chain === 'Astar') return 'ASTR'
      return 'DOT'
    })
    vi.mocked(getExistentialDepositOrThrow).mockImplementation(chain => {
      if (chain === origin) return 50n
      if (chain === destination) return 30n
      return 10n
    })
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(50n)
    vi.mocked(getBalanceNative).mockResolvedValue(1000n)
  })

  it('returns undefined when feeAsset is provided', async () => {
    const feeAsset = { symbol: 'DOT' } as TAssetInfo
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
    expect(getBalanceNative).toHaveBeenCalledWith({
      api: mockApi,
      chain: origin,
      address: senderAddress
    })
    expect(result).toBe(true)
  })

  it('returns false when native asset to both origin and destination with insufficient balance', async () => {
    vi.mocked(isSymbolMatch).mockReturnValue(true)
    vi.mocked(getBalanceNative).mockResolvedValue(150n) // 150 - 50 - 100 - 50 = -50

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
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(200n)

    const nonNativeAsset = { symbol: 'USDT' } as TAssetInfo
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

    expect(getAssetBalanceInternal).toHaveBeenCalledWith({
      api: mockApi,
      chain: origin,
      address: senderAddress,
      asset: nonNativeAsset
    })
    expect(getEdFromAssetOrThrow).toHaveBeenCalledWith(nonNativeAsset)
    expect(result).toBe(true)
  })

  it('returns false when non-native asset with insufficient native balance', async () => {
    vi.mocked(isSymbolMatch).mockImplementation((assetSymbol, nativeSymbol) => {
      return assetSymbol === nativeSymbol
    })
    vi.mocked(getBalanceNative).mockResolvedValue(100n) // 100 - 50 - 100 = -50

    const nonNativeAsset = { symbol: 'USDT' } as TAssetInfo
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
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(30n) // 30 - 50 = -20

    const nonNativeAsset = { symbol: 'USDT' } as TAssetInfo
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
  const asset = { symbol: 'ASTR' } as TAssetInfo

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ASTR')
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(30n)
    vi.mocked(getBalanceNative).mockResolvedValue(200n)
  })

  it('returns undefined when asset is not native to destination', async () => {
    vi.mocked(isSymbolMatch).mockReturnValue(false)

    const nonNativeAsset = { symbol: 'USDT' } as TAssetInfo
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
    expect(getBalanceNative).toHaveBeenCalledWith({
      api: mockApi,
      chain: destination,
      address: address
    })
    // 200 + 100 - 30 - 50 = 220 > 0
    expect(result).toBe(true)
  })

  it('returns false when native asset with insufficient balance', async () => {
    vi.mocked(isSymbolMatch).mockReturnValue(true)
    vi.mocked(getBalanceNative).mockResolvedValue(50n)
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
    vi.mocked(getBalanceNative).mockResolvedValue(30n)
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
