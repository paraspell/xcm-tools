import { describe, expect, it, vi } from 'vitest'

import type { TAssetInfo } from '../types'
import { getAssets, getNativeAssetSymbol } from './assets'
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
    location: { parents: 1, interior: { Here: null } }
  }

  const ksmAsset: TAssetInfo = {
    symbol: 'KSM',
    assetId: '200',
    decimals: 18,
    location: {
      parents: 2,
      interior: {
        X1: [
          {
            GlobalConsensus: {
              kusama: null
            }
          }
        ]
      }
    }
  }

  const ajunAsset: TAssetInfo = {
    symbol: 'AJUN',
    assetId: '300',
    decimals: 18,
    location: { parents: 1, interior: { X1: [{ Parachain: 1000 }] } }
  }

  const usdtAsset: TAssetInfo = {
    symbol: 'USDT',
    assetId: '500',
    decimals: 6,
    location: { parents: 1, interior: { X1: [{ Parachain: 1000 }] } }
  }

  it('should return native system assets and stablecoins for substrate bridge transfers', () => {
    vi.mocked(getAssets).mockImplementation(chain => {
      if (chain === 'AssetHubPolkadot') return [dotAsset, ksmAsset, ajunAsset]
      if (chain === 'AssetHubKusama') return [dotAsset, ksmAsset]
      return []
    })
    vi.mocked(getNativeAssetSymbol).mockImplementation(chain => {
      if (chain === 'AssetHubPolkadot') return 'DOT'
      if (chain === 'AssetHubKusama') return 'KSM'
      return ''
    })
    vi.mocked(findStablecoinAssets).mockReturnValue([usdtAsset])

    const result = getSupportedAssets('AssetHubPolkadot', 'AssetHubKusama')
    expect(result).toEqual([dotAsset, ksmAsset, usdtAsset])
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

  it('should return system assets and supported assets for snowbridge transfers', () => {
    const mockOriginAssets = [dotAsset, ajunAsset]
    const mockDestinationAssets = [{ ...ajunAsset, assetId: '400' }]
    vi.mocked(getAssets).mockImplementation(chain => {
      if (chain === 'AssetHubPolkadot') return mockOriginAssets
      if (chain === 'Ethereum') return mockDestinationAssets
      return []
    })
    vi.mocked(findStablecoinAssets).mockReturnValue([])

    const result = getSupportedAssets('AssetHubPolkadot', 'Ethereum')
    expect(result).toEqual([dotAsset, ajunAsset])
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
