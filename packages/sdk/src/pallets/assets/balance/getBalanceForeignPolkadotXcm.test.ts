import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ApiPromise } from '@polkadot/api'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'
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

    const result = await getBalanceForeignPolkadotXcm(mockApi, 'Mythos', 'some-address', {
      symbol: 'DOT',
      assetId: '1'
    })

    expect(result).toBe(BigInt(1000))
  })

  it('should return balance for AssetHubPolkadot node', async () => {
    const mockApi = {
      getAssetHubForeignBalance: vi.fn().mockResolvedValue(BigInt(500)),
      getBalanceForeignAssetsAccount: vi.fn().mockResolvedValue(BigInt(500))
    } as unknown as IPolkadotApi<ApiPromise, Extrinsic>

    const result = await getBalanceForeignPolkadotXcm(mockApi, 'AssetHubPolkadot', 'some-address', {
      symbol: 'DOT',
      assetId: '1'
    })

    expect(result).toBe(BigInt(500))
  })
})
