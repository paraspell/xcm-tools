import { InvalidCurrencyError } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'

vi.mock('./getAssetHubMultiLocation', () => ({
  getAssetHubMultiLocation: vi.fn()
}))

describe('getBalanceForeignPolkadotXcm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should return balance for Mythos node', async () => {
    const mockApi = {
      getMythosForeignBalance: vi.fn().mockResolvedValue(1000n)
    } as unknown as IPolkadotApi<unknown, unknown>

    const result = await getBalanceForeignPolkadotXcm(mockApi, 'Mythos', 'some-address', {
      symbol: 'DOT',
      assetId: '1'
    })

    expect(result).toBe(1000n)
  })

  it('should return balance for AssetHubPolkadot node', async () => {
    const mockApi = {
      getAssetHubForeignBalance: vi.fn().mockResolvedValue(500n),
      getBalanceForeignAssetsAccount: vi.fn().mockResolvedValue(500n)
    } as unknown as IPolkadotApi<unknown, unknown>

    const result = await getBalanceForeignPolkadotXcm(mockApi, 'AssetHubPolkadot', 'some-address', {
      symbol: 'DOT',
      assetId: '1'
    })

    expect(result).toBe(500n)
  })

  it('should return balance for Polimec node', async () => {
    const mockApi = {
      getAssetHubForeignBalance: vi.fn().mockResolvedValue(200n)
    } as unknown as IPolkadotApi<unknown, unknown>

    const result = await getBalanceForeignPolkadotXcm(mockApi, 'Polimec', 'some-address', {
      symbol: 'DOT',
      multiLocation: { foo: 'bar' }
    })

    expect(result).toBe(200n)
  })

  it('should return balance for Moonbeam node', async () => {
    const mockApi = {
      getBalanceForeignAssetsAccount: vi.fn().mockResolvedValue(300n)
    } as unknown as IPolkadotApi<unknown, unknown>

    const result = await getBalanceForeignPolkadotXcm(mockApi, 'Moonbeam', 'some-address', {
      symbol: 'DOT',
      assetId: '1'
    })

    expect(result).toBe(300n)
  })

  it('should return balance for Moonriver node', async () => {
    const mockApi = {
      getBalanceForeignAssetsAccount: vi.fn().mockResolvedValue(400n)
    } as unknown as IPolkadotApi<unknown, unknown>

    const result = await getBalanceForeignPolkadotXcm(mockApi, 'Moonriver', 'some-address', {
      symbol: 'DOT',
      assetId: '1'
    })

    expect(result).toBe(400n)
  })

  it('should throw error if asset is not foreign', async () => {
    const mockApi = {} as unknown as IPolkadotApi<unknown, unknown>

    await expect(
      getBalanceForeignPolkadotXcm(mockApi, 'Moonriver', 'some-address', {
        symbol: 'DOT',
        isNative: true
      })
    ).rejects.toThrowError(InvalidCurrencyError)
  })
})
