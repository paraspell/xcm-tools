import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ApiPromise } from '@polkadot/api'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'
import { getAssetHubMultiLocation } from './getAssetHubMultiLocation'
import { u32 } from '@polkadot/types'

vi.mock('./getAssetHubMultiLocation', () => ({
  getAssetHubMultiLocation: vi.fn()
}))

describe('getBalanceForeignPolkadotXcm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should return balance for Mythos node', async () => {
    const mockApi = {
      query: {
        balances: {
          account: vi.fn().mockResolvedValue({
            toJSON: () => ({ free: '1000' })
          })
        },
        foreignAssets: {
          account: vi.fn()
        },
        assets: {
          account: vi.fn()
        }
      },
      registry: {
        createType: vi.fn()
      }
    } as unknown as ApiPromise

    const result = await getBalanceForeignPolkadotXcm('some-address', undefined, mockApi, 'Mythos')

    expect(mockApi.query.balances.account).toHaveBeenCalledWith('some-address')
    expect(result).toBe(BigInt(1000))
  })

  it('should return balance for AssetHubPolkadot node', async () => {
    const mockApi = {
      query: {
        balances: {
          account: vi.fn()
        },
        foreignAssets: {
          account: vi.fn().mockResolvedValue({
            toJSON: () => ({ balance: '500' })
          })
        },
        assets: {
          account: vi.fn()
        }
      },
      registry: {
        createType: vi.fn()
      }
    } as unknown as ApiPromise

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
    expect(mockApi.query.foreignAssets.account).toHaveBeenCalledWith(
      { parents: 1, interior: { X1: { Parachain: '2000' } } },
      'some-address'
    )
    expect(result).toBe(BigInt(500))
  })

  it('should return balance for other nodes using assets.account', async () => {
    const validId = '1000'

    const mockApi = {
      query: {
        balances: {
          account: vi.fn()
        },
        foreignAssets: {
          account: vi.fn()
        },
        assets: {
          account: vi.fn().mockResolvedValue({
            toJSON: () => ({ balance: '200' })
          })
        }
      },
      registry: {
        createType: vi.fn()
      }
    } as unknown as ApiPromise

    const result = await getBalanceForeignPolkadotXcm('some-address', validId, mockApi)

    const mockU32 = new u32(mockApi.registry, validId)
    expect(mockApi.query.assets.account).toHaveBeenCalledWith(mockU32, 'some-address')
    expect(result).toBe(BigInt(200))
  })

  it('should return null and log error if an error occurs', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const mockApi = {
      query: {
        balances: {
          account: vi.fn().mockRejectedValue(new Error('API error'))
        },
        foreignAssets: {
          account: vi.fn()
        },
        assets: {
          account: vi.fn()
        }
      },
      registry: {
        createType: vi.fn()
      }
    } as unknown as ApiPromise

    // Simulate an error in API query
    vi.mocked(mockApi.query.balances.account).mockRejectedValue(new Error('API error'))

    const result = await getBalanceForeignPolkadotXcm('some-address', undefined, mockApi, 'Mythos')

    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith('Error while fetching balance', new Error('API error'))
  })
})
