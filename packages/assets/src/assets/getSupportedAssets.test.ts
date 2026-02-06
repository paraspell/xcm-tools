import { describe, expect, it, vi } from 'vitest'

import type { TAssetInfo } from '../types'
import { getAssets } from './assets'
import { getSupportedAssets } from './getSupportedAssets'
import { findStablecoinAssets } from './search/findStablecoinAssets'

vi.mock('./assets')
vi.mock('./search/findStablecoinAssets', () => ({
  findStablecoinAssets: vi.fn().mockReturnValue([])
}))

describe('getSupportedAssets', () => {
  const dotAsset: TAssetInfo = {
    symbol: 'DOT',
    assetId: '100',
    decimals: 10,
    location: { parents: 1, interior: 'Here' }
  }

  const ksmAsset: TAssetInfo = {
    symbol: 'KSM',
    assetId: '200',
    decimals: 18,
    location: { parents: 2, interior: 'Here' }
  }

  const ajunAsset: TAssetInfo = {
    symbol: 'AJUN',
    assetId: '300',
    decimals: 18,
    location: { parents: 1, interior: { X1: [{ Parachain: 1000 }] } }
  }

  it('should return DOT and KSM assets when origin and destination are AssetHubPolkadot and AssetHubKusama', () => {
    vi.mocked(getAssets).mockImplementation(_chain => {
      return [dotAsset, ksmAsset]
    })
    vi.mocked(findStablecoinAssets).mockReturnValue([])

    const result = getSupportedAssets('AssetHubPolkadot', 'AssetHubKusama')
    expect(result).toEqual([dotAsset, ksmAsset])

    const result2 = getSupportedAssets('AssetHubKusama', 'AssetHubPolkadot')
    expect(result2).toEqual([dotAsset, ksmAsset])
  })

  it('should return common assets between origin and destination', () => {
    const mockOriginAssets = [ajunAsset, dotAsset]
    const mockDestinationAssets = [{ ...ajunAsset, assetId: '400' }]
    vi.mocked(getAssets).mockImplementation(chain => {
      if (chain === 'Ajuna') return mockOriginAssets
      if (chain === 'Polkadot') return mockDestinationAssets
      return []
    })
    vi.mocked(findStablecoinAssets).mockReturnValue([])

    const result = getSupportedAssets('Ajuna', 'Polkadot')
    expect(result).toEqual([ajunAsset])
  })

  it('should return empty array if no common assets between origin and destination', () => {
    const mockOriginAssets = [ajunAsset]
    const mockDestinationAssets = [dotAsset]
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
