import { InvalidCurrencyError, type TAssetInfo, type TNativeAssetInfo } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api'
import { getBalanceForeignXTokens } from './getBalanceForeignXTokens'

const mockApi = {
  getBalanceAssetsPallet: vi.fn(),
  getBalanceForeignXTokens: vi.fn(),
  getBalanceForeignBifrost: vi.fn()
} as unknown as IPolkadotApi<unknown, unknown>

describe('getBalanceForeignXTokens', () => {
  const address = '5F3sa2TJAWMqDhXG6jhV4N8ko9NmoaMZP8F3sa2TJAWMqDh'
  const asset: TAssetInfo = { assetId: '1', symbol: 'AssetName', decimals: 12 }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls getBalanceForeignMoonbeam when chain is Astar', async () => {
    const spy = vi.spyOn(mockApi, 'getBalanceAssetsPallet').mockResolvedValue(1000n)
    const spy2 = vi.spyOn(mockApi, 'getBalanceForeignXTokens')
    const balance = await getBalanceForeignXTokens(mockApi, 'Astar', address, asset)
    expect(spy).toHaveBeenCalledWith(address, BigInt(asset.assetId ?? ''))
    expect(spy2).not.toHaveBeenCalled()
    expect(balance).toBe(1000n)
  })

  it('calls getBalanceForeignAssetsAccount when chain is Shiden', async () => {
    const spy = vi.spyOn(mockApi, 'getBalanceAssetsPallet').mockResolvedValue(2000n)
    const spy2 = vi.spyOn(mockApi, 'getBalanceForeignXTokens')
    const balance = await getBalanceForeignXTokens(mockApi, 'Shiden', address, asset)
    expect(spy).toHaveBeenCalledWith(address, BigInt(asset.assetId ?? ''))
    expect(spy2).not.toHaveBeenCalled()
    expect(balance).toBe(2000n)
  })

  it('calls getBalanceForeignXTokens for any other chain', async () => {
    const spy = vi.spyOn(mockApi, 'getBalanceForeignXTokens').mockResolvedValue(3000n)
    const spy2 = vi.spyOn(mockApi, 'getBalanceAssetsPallet')
    const balance = await getBalanceForeignXTokens(mockApi, 'Acala', address, asset)
    expect(spy).toHaveBeenCalledWith('Acala', address, asset)
    expect(spy2).not.toHaveBeenCalled()
    expect(balance).toBe(3000n)
  })

  it('calls getBalanceForeignBifrost when chain is BifrostPolkadot', async () => {
    const spy = vi.spyOn(mockApi, 'getBalanceForeignBifrost').mockResolvedValue(4000n)
    const spy2 = vi.spyOn(mockApi, 'getBalanceForeignXTokens')
    const balance = await getBalanceForeignXTokens(mockApi, 'BifrostPolkadot', address, asset)
    expect(spy).toHaveBeenCalledWith(address, asset)
    expect(spy2).not.toHaveBeenCalled()
    expect(balance).toBe(4000n)
  })

  it('returns 0 if getBalanceForeignMoonbeam resolves with 0', async () => {
    vi.spyOn(mockApi, 'getBalanceAssetsPallet').mockResolvedValue(0n)
    const balance = await getBalanceForeignXTokens(mockApi, 'Astar', address, asset)
    expect(balance).toEqual(0n)
  })

  it('returns 0 if getBalanceForeignXTokens resolves with 0', async () => {
    vi.spyOn(mockApi, 'getBalanceForeignXTokens').mockResolvedValue(0n)
    const balance = await getBalanceForeignXTokens(mockApi, 'Acala', address, asset)
    expect(balance).toEqual(0n)
  })

  it('throws InvalidCurrencyError if asset has no assetId', async () => {
    await expect(
      getBalanceForeignXTokens(mockApi, 'Astar', address, {
        symbol: 'AssetName'
      } as TNativeAssetInfo)
    ).rejects.toThrow(InvalidCurrencyError)
  })
})
