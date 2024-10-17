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
    const mockApi = {} as unknown as IPolkadotApi<ApiPromise, Extrinsic>

    const result = await getBalanceForeignPolkadotXcm('some-address', undefined, mockApi, 'Mythos')

    // expect(mockApi.query.balances.account).toHaveBeenCalledWith('some-address')
    expect(result).toBe(BigInt(1000))
  })

  it('should return balance for AssetHubPolkadot node', async () => {
    const mockApi = {} as unknown as IPolkadotApi<ApiPromise, Extrinsic>

    // Mock getAssetHubMultiLocation
    vi.mocked(getAssetHubMultiLocation).mockReturnValue({
      parents: 1,
      interior: { X1: { Parachain: '2000' } }
    })

    const result = await getBalanceForeignPolkadotXcm(
      'some-address',
      'some-id',
      mockApi,
      'AssetHubPolkadot',
      'DOT'
    )

    expect(getAssetHubMultiLocation).toHaveBeenCalledWith('DOT')
    // expect(mockApi.query.foreignAssets.account).toHaveBeenCalledWith(
    //   { parents: 1, interior: { X1: { Parachain: '2000' } } },
    //   'some-address'
    // )
    expect(result).toBe(BigInt(500))
  })

  it('should return balance for other nodes using assets.account', async () => {
    const validId = '1000'

    const mockApi = {} as unknown as IPolkadotApi<ApiPromise, Extrinsic>

    const result = await getBalanceForeignPolkadotXcm('some-address', validId, mockApi)

    // const mockU32 = new u32(mockApi.registry, validId)
    // expect(mockApi.query.assets.account).toHaveBeenCalledWith(mockU32, 'some-address')
    expect(result).toBe(BigInt(200))
  })

  it('should return null and log error if an error occurs', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const mockApi = {} as unknown as IPolkadotApi<ApiPromise, Extrinsic>

    // Simulate an error in API query
    // vi.mocked(mockApi.query.balances.account).mockRejectedValue(new Error('API error'))

    const result = await getBalanceForeignPolkadotXcm('some-address', undefined, mockApi, 'Mythos')

    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith('Error while fetching balance', new Error('API error'))
  })
})
