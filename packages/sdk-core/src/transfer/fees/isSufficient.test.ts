import type { TAssetInfo } from '@paraspell/assets'
import { getEdFromAssetOrThrow, isSymbolMatch } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { getAssetBalanceInternal, getBalanceInternal } from '../../balance'
import { isSufficientDestination, isSufficientOrigin } from './isSufficient'

vi.mock('@paraspell/assets')

vi.mock('../../pallets/assets/balance')
vi.mock('../../balance')

describe('isSufficientOrigin', () => {
  const mockApi = {
    getNativeAssetSymbol: vi.fn(),
    getExistentialDepositOrThrow: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>
  const origin = 'Acala'
  const destination = 'Astar'
  const sender = 'Alice'
  const feeNative = 100n
  const amount = 50n
  const asset = { symbol: 'ACA' } as TAssetInfo

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(mockApi, 'getNativeAssetSymbol').mockImplementation(chain => {
      if (chain === 'Acala') return 'ACA'
      if (chain === 'Astar') return 'ASTR'
      return 'DOT'
    })
    vi.spyOn(mockApi, 'getExistentialDepositOrThrow').mockImplementation(chain => {
      if (chain === origin) return 50n
      if (chain === destination) return 30n
      return 10n
    })
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(50n)
    vi.mocked(getBalanceInternal).mockResolvedValue(1000n)
  })

  it('returns undefined when feeAsset is provided', async () => {
    const feeAsset = { symbol: 'DOT' } as TAssetInfo
    const result = await isSufficientOrigin(
      mockApi,
      origin,
      destination,
      sender,
      feeNative,
      { ...asset, amount },
      feeAsset
    )
    expect(result).toBeUndefined()
  })

  it('returns true when native asset to both origin and destination with sufficient balance', async () => {
    vi.mocked(isSymbolMatch).mockReturnValue(true)

    const edSpy = vi.spyOn(mockApi, 'getExistentialDepositOrThrow')

    const result = await isSufficientOrigin(
      mockApi,
      origin,
      destination,
      sender,
      feeNative,
      { ...asset, amount },
      undefined
    )

    expect(isSymbolMatch).toHaveBeenCalledWith('ACA', 'ACA')
    expect(isSymbolMatch).toHaveBeenCalledWith('ACA', 'ASTR')
    expect(edSpy).toHaveBeenCalledWith(origin)
    expect(getBalanceInternal).toHaveBeenCalledWith({
      api: mockApi,
      chain: origin,
      address: sender
    })
    expect(result).toBe(true)
  })

  it('returns false when native asset to both origin and destination with insufficient balance', async () => {
    vi.mocked(isSymbolMatch).mockReturnValue(true)
    vi.mocked(getBalanceInternal).mockResolvedValue(150n) // 150 - 50 - 100 - 50 = -50

    const result = await isSufficientOrigin(
      mockApi,
      origin,
      destination,
      sender,
      feeNative,
      { ...asset, amount },
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
      sender,
      feeNative,
      { ...nonNativeAsset, amount },
      undefined
    )

    expect(getAssetBalanceInternal).toHaveBeenCalledWith({
      api: mockApi,
      chain: origin,
      address: sender,
      asset: { ...nonNativeAsset, amount }
    })
    expect(getEdFromAssetOrThrow).toHaveBeenCalledWith({ ...nonNativeAsset, amount })
    expect(result).toBe(true)
  })

  it('returns false when non-native asset with insufficient native balance', async () => {
    vi.mocked(isSymbolMatch).mockImplementation((assetSymbol, nativeSymbol) => {
      return assetSymbol === nativeSymbol
    })
    vi.mocked(getBalanceInternal).mockResolvedValue(100n) // 100 - 50 - 100 = -50

    const nonNativeAsset = { symbol: 'USDT' } as TAssetInfo
    const result = await isSufficientOrigin(
      mockApi,
      origin,
      destination,
      sender,
      feeNative,
      { ...nonNativeAsset, amount },
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
      sender,
      feeNative,
      { ...nonNativeAsset, amount },
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
      sender,
      feeNative,
      { ...asset, amount },
      undefined
    )

    expect(result).toBe(true)
  })
})

describe('isSufficientDestination', () => {
  const mockApi = {
    getNativeAssetSymbol: vi.fn(),
    getExistentialDepositOrThrow: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>
  const destination = 'Astar'
  const address = 'Bob'
  const amount = 100n
  const feeNative = 50n
  const asset = { symbol: 'ASTR' } as TAssetInfo

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(mockApi, 'getNativeAssetSymbol').mockReturnValue('ASTR')
    vi.spyOn(mockApi, 'getExistentialDepositOrThrow').mockReturnValue(30n)
    vi.mocked(getBalanceInternal).mockResolvedValue(200n)
  })

  it('returns undefined when asset is not native to destination', async () => {
    vi.mocked(isSymbolMatch).mockReturnValue(false)

    const nonNativeAsset = { symbol: 'USDT' } as TAssetInfo
    const result = await isSufficientDestination(
      mockApi,
      destination,
      address,
      { ...nonNativeAsset, amount },
      feeNative
    )

    expect(isSymbolMatch).toHaveBeenCalledWith('USDT', 'ASTR')
    expect(result).toBeUndefined()
  })

  it('returns true when native asset with sufficient balance', async () => {
    vi.mocked(isSymbolMatch).mockReturnValue(true)

    const edSpy = vi.spyOn(mockApi, 'getExistentialDepositOrThrow')

    const result = await isSufficientDestination(
      mockApi,
      destination,
      address,
      { ...asset, amount },
      feeNative
    )

    expect(isSymbolMatch).toHaveBeenCalledWith('ASTR', 'ASTR')
    expect(edSpy).toHaveBeenCalledWith(destination)
    expect(getBalanceInternal).toHaveBeenCalledWith({
      api: mockApi,
      chain: destination,
      address: address
    })
    // 200 + 100 - 30 - 50 = 220 > 0
    expect(result).toBe(true)
  })

  it('returns false when native asset with insufficient balance', async () => {
    vi.mocked(isSymbolMatch).mockReturnValue(true)
    vi.mocked(getBalanceInternal).mockResolvedValue(50n)
    vi.spyOn(mockApi, 'getExistentialDepositOrThrow').mockReturnValue(200n)

    const result = await isSufficientDestination(
      mockApi,
      destination,
      address,
      { ...asset, amount },
      feeNative
    )

    // 50 + 100 - 200 - 50 = -100 <= 0
    expect(result).toBe(false)
  })

  it('handles edge case where balance + amount equals existential deposit + fee', async () => {
    vi.mocked(isSymbolMatch).mockReturnValue(true)
    vi.mocked(getBalanceInternal).mockResolvedValue(30n)
    vi.spyOn(mockApi, 'getExistentialDepositOrThrow').mockReturnValue(50n)

    const result = await isSufficientDestination(
      mockApi,
      destination,
      address,
      { ...asset, amount: 20n },
      feeNative
    )

    // 30 + 20 - 50 - 50 = -50 <= 0
    expect(result).toBe(false)
  })
})
