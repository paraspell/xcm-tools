import { describe, expect, it, vi } from 'vitest'

import { getAssets } from './assets'
import { getSupportedAssets } from './getSupportedAssets'
import { findStablecoinAssets } from './search/findStablecoinAssets'

vi.mock('./assets')
vi.mock('./search/findStablecoinAssets', () => ({
  findStablecoinAssets: vi.fn().mockReturnValue([])
}))

describe('getSupportedAssets', () => {
  it('should return DOT and KSM assets when origin and destination are AssetHubPolkadot and AssetHubKusama', () => {
    const mockDOTAsset = { symbol: 'DOT', assetId: '100', decimals: 18 }
    const mockKSMAsset = { symbol: 'KSM', assetId: '200', decimals: 18 }
    vi.mocked(getAssets).mockImplementation(_chain => {
      return [mockDOTAsset, mockKSMAsset]
    })
    vi.mocked(findStablecoinAssets).mockReturnValue([])

    const result = getSupportedAssets('AssetHubPolkadot', 'AssetHubKusama')
    expect(result).toEqual([mockDOTAsset, mockKSMAsset])

    const result2 = getSupportedAssets('AssetHubKusama', 'AssetHubPolkadot')
    expect(result2).toEqual([mockDOTAsset, mockKSMAsset])
  })

  it('should return common assets between origin and destination', () => {
    const mockOriginAssets = [
      { symbol: 'AJUN', assetId: '300', decimals: 18 },
      { symbol: 'DOT', assetId: '100', decimals: 18 }
    ]
    const mockDestinationAssets = [{ symbol: 'AJUN', assetId: '400', decimals: 18 }]
    vi.mocked(getAssets).mockImplementation(chain => {
      if (chain === 'Ajuna') return mockOriginAssets
      if (chain === 'Polkadot') return mockDestinationAssets
      return []
    })
    vi.mocked(findStablecoinAssets).mockReturnValue([])

    const result = getSupportedAssets('Ajuna', 'Polkadot')
    expect(result).toEqual([{ symbol: 'AJUN', decimals: 18, assetId: '300' }])
  })

  it('should return empty array if no common assets between origin and destination', () => {
    const mockOriginAssets = [{ symbol: 'AJUN', assetId: '300', decimals: 18 }]
    const mockDestinationAssets = [{ symbol: 'DOT', assetId: '100', decimals: 18 }]
    vi.mocked(getAssets).mockImplementation(chain => {
      if (chain === 'Ajuna') return mockOriginAssets
      if (chain === 'Polkadot') return mockDestinationAssets
      return []
    })
    vi.mocked(findStablecoinAssets).mockReturnValue([])

    const result = getSupportedAssets('Ajuna', 'Polkadot')
    expect(result).toEqual([])
  })
})
