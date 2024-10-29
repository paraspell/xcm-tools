import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ApiPromise } from '@polkadot/api'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'
import { getAssetHubMultiLocation } from './getAssetHubMultiLocation'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import type { Extrinsic } from '../../../pjs/types'

vi.mock('./getAssetHubMultiLocation', () => ({
  getAssetHubMultiLocation: vi.fn()
}))

describe('getBalanceForeignPolkadotXcm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should return balance for Mythos node', async () => {
    const mockApi = {
      getMythosForeignBalance: vi.fn().mockResolvedValue(BigInt(1000))
    } as unknown as IPolkadotApi<ApiPromise, Extrinsic>

    const result = await getBalanceForeignPolkadotXcm(
      'some-address',
      { symbol: 'DOT', assetId: '1' },
      mockApi,
      'Mythos'
    )

    expect(result).toBe(BigInt(1000))
  })

  it('should return balance for AssetHubPolkadot node', async () => {
    const mockApi = {
      getAssetHubForeignBalance: vi.fn().mockResolvedValue(BigInt(500))
    } as unknown as IPolkadotApi<ApiPromise, Extrinsic>

    vi.mocked(getAssetHubMultiLocation).mockReturnValue({
      parents: 1,
      interior: { X1: { Parachain: '2000' } }
    })

    const result = await getBalanceForeignPolkadotXcm(
      'some-address',
      { symbol: 'DOT', assetId: '1' },
      mockApi,
      'AssetHubPolkadot'
    )

    expect(getAssetHubMultiLocation).toHaveBeenCalledWith('DOT')
    expect(result).toBe(BigInt(500))
  })

  it('should return null and log error if an error occurs', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const mockApi = {
      getMythosForeignBalance: vi.fn().mockRejectedValue(new Error('API error'))
    } as unknown as IPolkadotApi<ApiPromise, Extrinsic>

    const result = await getBalanceForeignPolkadotXcm(
      'some-address',
      { symbol: 'DOT', assetId: '1' },
      mockApi,
      'Mythos'
    )

    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith('Error while fetching balance', expect.any(Error))

    consoleSpy.mockRestore()
  })
})
