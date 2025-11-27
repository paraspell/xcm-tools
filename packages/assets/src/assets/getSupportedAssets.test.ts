import { describe, expect, it, vi } from 'vitest'

import { getAssets } from './assets'
import { getSupportedAssets } from './getSupportedAssets'

vi.mock('./assets')

describe('getSupportedAssets', () => {
  it('should return DOT and KSM assets when origin and destination are AssetHubPolkadot and AssetHubKusama', () => {
    const mockDOTAsset = { symbol: 'DOT', assetId: '100', decimals: 18 }
    const mockKSMAsset = { symbol: 'KSM', assetId: '200', decimals: 18 }
    vi.mocked(getAssets).mockImplementation(_chain => {
      return [mockDOTAsset, mockKSMAsset]
    })

    const result = getSupportedAssets('AssetHubPolkadot', 'AssetHubKusama')
    expect(result).toEqual([mockDOTAsset, mockKSMAsset])

    const result2 = getSupportedAssets('AssetHubKusama', 'AssetHubPolkadot')
    expect(result2).toEqual([mockDOTAsset, mockKSMAsset])
  })

  it('should return common assets between origin and destination', () => {
    const mockOriginAssets = [
      { symbol: 'PHA', assetId: '300', decimals: 18 },
      { symbol: 'DOT', assetId: '100', decimals: 18 }
    ]
    const mockDestinationAssets = [{ symbol: 'PHA', assetId: '400', decimals: 18 }]
    vi.mocked(getAssets).mockImplementation(chain => {
      if (chain === 'Phala') return mockOriginAssets
      if (chain === 'Polkadot') return mockDestinationAssets
      return []
    })

    const result = getSupportedAssets('Phala', 'Polkadot')
    expect(result).toEqual([{ symbol: 'PHA', decimals: 18, assetId: '300' }])
  })

  it('should return empty array if no common assets between origin and destination', () => {
    const mockOriginAssets = [{ symbol: 'PHA', assetId: '300', decimals: 18 }]
    const mockDestinationAssets = [{ symbol: 'DOT', assetId: '100', decimals: 18 }]
    vi.mocked(getAssets).mockImplementation(chain => {
      if (chain === 'Phala') return mockOriginAssets
      if (chain === 'Polkadot') return mockDestinationAssets
      return []
    })

    const result = getSupportedAssets('Phala', 'Polkadot')
    expect(result).toEqual([])
  })
})
