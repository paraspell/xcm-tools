import { describe, it, expect, vi } from 'vitest'
import { getAssets, getOtherAssets } from './assets'
import { getSupportedAssets } from './getSupportedAssets'
import { getAssetBySymbolOrId } from './getAssetBySymbolOrId'

vi.mock('./assets', () => ({
  getAssets: vi.fn(),
  getOtherAssets: vi.fn()
}))

vi.mock('./getAssetBySymbolOrId', () => ({
  getAssetBySymbolOrId: vi.fn()
}))

vi.mock('../../utils', () => ({
  isRelayChain: vi.fn()
}))

vi.mock('../pallets', () => ({
  getDefaultPallet: vi.fn()
}))

describe('getSupportedAssets', () => {
  it('should return Ethereum assets when either origin or destination is Ethereum', () => {
    const mockAssets = [{ symbol: 'ETH', assetId: '1' }]
    vi.mocked(getOtherAssets).mockReturnValue(mockAssets)

    const result = getSupportedAssets('Ethereum', 'Polkadot')
    expect(result).toEqual(mockAssets)
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')

    const result2 = getSupportedAssets('Polkadot', 'Ethereum')
    expect(result2).toEqual(mockAssets)
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
  })

  it('should return DOT and KSM assets when origin and destination are AssetHubPolkadot and AssetHubKusama', () => {
    const mockDOTAsset = { symbol: 'DOT', assetId: '100' }
    const mockKSMAsset = { symbol: 'KSM', assetId: '200' }
    vi.mocked(getAssetBySymbolOrId).mockImplementation((chain, asset) => {
      if (chain === 'Polkadot' && 'symbol' in asset && asset.symbol === 'DOT') return mockDOTAsset
      if (chain === 'Kusama' && 'symbol' in asset && asset.symbol === 'KSM') return mockKSMAsset
      return null
    })

    const result = getSupportedAssets('AssetHubPolkadot', 'AssetHubKusama')
    expect(result).toEqual([mockDOTAsset, mockKSMAsset])
    expect(getAssetBySymbolOrId).toHaveBeenCalledWith('Polkadot', { symbol: 'DOT' })
    expect(getAssetBySymbolOrId).toHaveBeenCalledWith('Kusama', { symbol: 'KSM' })

    const result2 = getSupportedAssets('AssetHubKusama', 'AssetHubPolkadot')
    expect(result2).toEqual([mockDOTAsset, mockKSMAsset])
  })

  it('should return common assets between origin and destination', () => {
    const mockOriginAssets = [
      { symbol: 'PHA', assetId: '300' },
      { symbol: 'DOT', assetId: '100' }
    ]
    const mockDestinationAssets = [{ symbol: 'PHA', assetId: '400' }]
    vi.mocked(getAssets).mockImplementation(node => {
      if (node === 'Phala') return mockOriginAssets
      if (node === 'Polkadot') return mockDestinationAssets
      return []
    })

    const result = getSupportedAssets('Phala', 'Polkadot')
    expect(result).toEqual([{ symbol: 'PHA', assetId: '300' }])
  })

  it('should return empty array if no common assets between origin and destination', () => {
    const mockOriginAssets = [{ symbol: 'PHA', assetId: '300' }]
    const mockDestinationAssets = [{ symbol: 'DOT', assetId: '100' }]
    vi.mocked(getAssets).mockImplementation(node => {
      if (node === 'Phala') return mockOriginAssets
      if (node === 'Polkadot') return mockDestinationAssets
      return []
    })

    const result = getSupportedAssets('Phala', 'Polkadot')
    expect(result).toEqual([])
  })

  it('should return WETH asset when origin is AssetHubPolkadot and destination is BifrostPolkadot', () => {
    const mockOriginAssets = [{ symbol: 'PHA', assetId: '300' }]
    const mockDestinationAssets = [{ symbol: 'PHA', assetId: '400' }]
    const mockWETHAsset = { symbol: 'WETH', assetId: '500' }
    vi.mocked(getAssets).mockImplementation(node => {
      if (node === 'AssetHubPolkadot') return mockOriginAssets
      if (node === 'BifrostPolkadot') return mockDestinationAssets
      return []
    })
    vi.mocked(getOtherAssets).mockReturnValue([mockWETHAsset])

    const result = getSupportedAssets('AssetHubPolkadot', 'BifrostPolkadot')
    expect(result).toEqual([...mockOriginAssets, { symbol: 'WETH.e', assetId: '500' }])
  })
})
