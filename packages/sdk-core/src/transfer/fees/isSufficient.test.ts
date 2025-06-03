import type { TAsset } from '@paraspell/assets'
import {
  getExistentialDepositOrThrow,
  getNativeAssetSymbol,
  normalizeSymbol
} from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { getBalanceNativeInternal } from '../../pallets/assets'
import { isSufficientDestination, isSufficientOrigin } from './isSufficient'

vi.mock('@paraspell/assets', () => ({
  getExistentialDepositOrThrow: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
  normalizeSymbol: vi.fn()
}))

vi.mock('../../pallets/assets', () => ({
  getBalanceNativeInternal: vi.fn()
}))

describe('isSufficientOrigin', () => {
  const mockApi = {} as IPolkadotApi<unknown, unknown>
  const node = 'Acala'
  const address = 'Alice'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when nativeBalance - deposit - fee > 0', async () => {
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(50n)
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(200n)

    const result = await isSufficientOrigin(mockApi, node, address, 100n)

    expect(getExistentialDepositOrThrow).toHaveBeenCalledWith(node)
    expect(getBalanceNativeInternal).toHaveBeenCalledWith({
      api: mockApi,
      node,
      address
    })
    expect(result).toBe(true)
  })

  it('returns false when nativeBalance - deposit - fee <= 0', async () => {
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(50n)
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(120n)

    const resultZero = await isSufficientOrigin(mockApi, node, address, 70n)
    expect(resultZero).toBe(false)

    vi.mocked(getBalanceNativeInternal).mockResolvedValue(100n)
    const resultNegative = await isSufficientOrigin(mockApi, node, address, 60n)
    expect(resultNegative).toBe(false)
  })
})

describe('isSufficientDestination', () => {
  const mockApi = {} as IPolkadotApi<unknown, unknown>
  const destination = 'Astar'
  const address = 'Bob'
  const asset = { symbol: 'ACA' } as TAsset

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
    vi.mocked(normalizeSymbol).mockImplementation(symbol => symbol ?? '')
  })

  it('returns true when balance + amount - deposit > 0 (symbol case)', async () => {
    const amount = 40n

    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(30n)
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(50n)

    const result = await isSufficientDestination(mockApi, destination, address, amount, asset)

    expect(getExistentialDepositOrThrow).toHaveBeenCalledWith(destination)
    expect(getBalanceNativeInternal).toHaveBeenCalledWith({
      api: mockApi,
      node: destination,
      address
    })
    expect(result).toBe(true)
  })

  it('returns false when balance + amount - deposit <= 0 (symbol case)', async () => {
    const amount = 20n

    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(100n)
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(30n)

    const result = await isSufficientDestination(mockApi, destination, address, amount, asset)

    expect(result).toBe(false)
  })

  it('uses multilocation when asset has it, and returns true', async () => {
    const amount = 100n
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(60n)
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(10n)

    const result = await isSufficientDestination(mockApi, destination, address, amount, asset)

    expect(getBalanceNativeInternal).toHaveBeenCalledWith({
      api: mockApi,
      node: destination,
      address
    })
    expect(result).toBe(true)
  })

  it('returns false when balance + amount - deposit <= 0 (multilocation case)', async () => {
    const amount = 100n

    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(200n)
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(50n)

    const result = await isSufficientDestination(mockApi, destination, address, amount, asset)

    expect(result).toBe(false)
  })
})
