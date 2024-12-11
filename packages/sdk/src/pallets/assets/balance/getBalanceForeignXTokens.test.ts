import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiPromise } from '@polkadot/api'
import type { IPolkadotApi } from '../../../api'
import type { TAsset, TNativeAsset } from '../../../types'
import { InvalidCurrencyError, type Extrinsic } from '../../../pjs'
import { getBalanceForeignXTokens } from './getBalanceForeignXTokens'

const mockApi = {
  getBalanceForeignAssetsAccount: vi.fn(),
  getBalanceForeignXTokens: vi.fn(),
  getBalanceForeignBifrost: vi.fn()
} as unknown as IPolkadotApi<ApiPromise, Extrinsic>

describe('getBalanceForeignXTokens', () => {
  const address = '5F3sa2TJAWMqDhXG6jhV4N8ko9NmoaMZP8F3sa2TJAWMqDh'
  const asset: TAsset = { assetId: '1', symbol: 'AssetName' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls getBalanceForeignMoonbeam when node is Moonbeam', async () => {
    const spy = vi.spyOn(mockApi, 'getBalanceForeignAssetsAccount').mockResolvedValue(BigInt(1000))
    const spy2 = vi.spyOn(mockApi, 'getBalanceForeignXTokens')
    const balance = await getBalanceForeignXTokens(mockApi, 'Moonbeam', address, asset)
    expect(spy).toHaveBeenCalledWith(address, BigInt(asset.assetId ?? ''))
    expect(spy2).not.toHaveBeenCalled()
    expect(balance).toBe(BigInt(1000))
  })

  it('calls getBalanceForeignMoonbeam when node is Moonriver', async () => {
    const spy = vi.spyOn(mockApi, 'getBalanceForeignAssetsAccount').mockResolvedValue(BigInt(2000))
    const spy2 = vi.spyOn(mockApi, 'getBalanceForeignXTokens')
    const balance = await getBalanceForeignXTokens(mockApi, 'Moonriver', address, asset)
    expect(spy).toHaveBeenCalledWith(address, BigInt(asset.assetId ?? ''))
    expect(spy2).not.toHaveBeenCalled()
    expect(balance).toBe(BigInt(2000))
  })

  it('calls getBalanceForeignXTokens for any other node', async () => {
    const spy = vi.spyOn(mockApi, 'getBalanceForeignXTokens').mockResolvedValue(BigInt(3000))
    const spy2 = vi.spyOn(mockApi, 'getBalanceForeignAssetsAccount')
    const balance = await getBalanceForeignXTokens(mockApi, 'Acala', address, asset)
    expect(spy).toHaveBeenCalledWith('Acala', address, asset)
    expect(spy2).not.toHaveBeenCalled()
    expect(balance).toBe(BigInt(3000))
  })

  it('calls getBalanceForeignBifrost when node is BifrostPolkadot', async () => {
    const spy = vi.spyOn(mockApi, 'getBalanceForeignBifrost').mockResolvedValue(BigInt(4000))
    const spy2 = vi.spyOn(mockApi, 'getBalanceForeignXTokens')
    const balance = await getBalanceForeignXTokens(mockApi, 'BifrostPolkadot', address, asset)
    expect(spy).toHaveBeenCalledWith(address, asset)
    expect(spy2).not.toHaveBeenCalled()
    expect(balance).toBe(BigInt(4000))
  })

  it('returns 0 if getBalanceForeignMoonbeam resolves with 0', async () => {
    vi.spyOn(mockApi, 'getBalanceForeignAssetsAccount').mockResolvedValue(BigInt(0))
    const balance = await getBalanceForeignXTokens(mockApi, 'Moonbeam', address, asset)
    expect(balance).toEqual(BigInt(0))
  })

  it('returns 0 if getBalanceForeignXTokens resolves with 0', async () => {
    vi.spyOn(mockApi, 'getBalanceForeignXTokens').mockResolvedValue(BigInt(0))
    const balance = await getBalanceForeignXTokens(mockApi, 'Acala', address, asset)
    expect(balance).toEqual(BigInt(0))
  })

  it('throws InvalidCurrencyError if asset has no assetId', async () => {
    await expect(
      getBalanceForeignXTokens(mockApi, 'Moonbeam', address, {
        symbol: 'AssetName'
      } as TNativeAsset)
    ).rejects.toThrow(InvalidCurrencyError)
  })
})
