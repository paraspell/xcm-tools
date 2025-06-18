import { describe, expect, it, vi } from 'vitest'

import { getAssets, getNativeAssetSymbol, getOtherAssets } from './assets'
import { filterEthCompatibleAssets } from './filterEthCompatibleAssets'
import { getSupportedAssets } from './getSupportedAssets'
import { isSymbolMatch } from './isSymbolMatch'

vi.mock('./assets', () => ({
  getAssets: vi.fn(),
  getOtherAssets: vi.fn(),
  getNativeAssetSymbol: vi.fn()
}))

vi.mock('./isSymbolMatch', () => ({
  isSymbolMatch: vi.fn()
}))

vi.mock('./search', () => ({
  findAsset: vi.fn()
}))

vi.mock('../../utils', () => ({
  isRelayChain: vi.fn()
}))

vi.mock('../pallets', () => ({
  getDefaultPallet: vi.fn()
}))

vi.mock('./filterEthCompatibleAssets', () => ({
  filterEthCompatibleAssets: vi.fn()
}))

describe('getSupportedAssets', () => {
  it('should return Ethereum assets when either origin or destination is Ethereum', () => {
    const ethAssets = [{ symbol: 'ETH', assetId: '1' }]
    vi.mocked(getOtherAssets).mockImplementation(node => (node === 'Ethereum' ? ethAssets : []))

    vi.mocked(filterEthCompatibleAssets).mockReturnValue([])

    const res1 = getSupportedAssets('Ethereum', 'Polkadot')
    expect(res1).toEqual(ethAssets)

    const res2 = getSupportedAssets('Polkadot', 'Ethereum')
    expect(res2).toEqual(ethAssets)

    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
    expect(filterEthCompatibleAssets).toHaveBeenCalled()
  })

  it('should return Ethereum compatible assets when origin is Moonbeam', () => {
    const moonbeamAssets = [
      { symbol: 'xcUSDT', assetId: '100' },
      { symbol: 'ETH', assetId: '1' }
    ]

    const ethCompatible = [{ symbol: 'ETH', assetId: '1' }]

    vi.mocked(getOtherAssets).mockImplementation(node => {
      if (node === 'Moonbeam') return moonbeamAssets
      if (node === 'Ethereum') return [{ symbol: 'WETH', assetId: '999' }]
      return []
    })

    vi.mocked(filterEthCompatibleAssets).mockReturnValue(ethCompatible)

    vi.mocked(getAssets).mockReturnValue([])

    const result = getSupportedAssets('Moonbeam', 'Ethereum')

    expect(result).toEqual(ethCompatible)

    expect(getOtherAssets).toHaveBeenCalledWith('Moonbeam')
    expect(filterEthCompatibleAssets).toHaveBeenCalledWith(moonbeamAssets)
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
  })

  it('should return only native Mythos assets when origin is Mythos and destination is Ethereum', () => {
    const ethereumAssets = [
      { symbol: 'MYTH', assetId: '1' },
      { symbol: 'ETH', assetId: '2' },
      { symbol: 'USDT', assetId: '3' }
    ]

    vi.mocked(getNativeAssetSymbol).mockReturnValue('MYTH')
    vi.mocked(isSymbolMatch).mockImplementation((symbol1, symbol2) => symbol1 === symbol2)

    vi.mocked(getOtherAssets).mockImplementation(node => {
      if (node === 'Ethereum') return ethereumAssets
      if (node === 'Mythos') return []
      return []
    })

    vi.mocked(filterEthCompatibleAssets).mockReturnValue([])

    const result = getSupportedAssets('Mythos', 'Ethereum')

    expect(result).toEqual([{ symbol: 'MYTH', assetId: '1' }])
    expect(getOtherAssets).toHaveBeenCalledWith('Mythos')
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
    expect(getNativeAssetSymbol).toHaveBeenCalledWith('Mythos')
  })

  it('should return DOT and KSM assets when origin and destination are AssetHubPolkadot and AssetHubKusama', () => {
    const mockDOTAsset = { symbol: 'DOT', assetId: '100' }
    const mockKSMAsset = { symbol: 'KSM', assetId: '200' }
    vi.mocked(getAssets).mockImplementation(_node => {
      return [mockDOTAsset, mockKSMAsset]
    })

    const result = getSupportedAssets('AssetHubPolkadot', 'AssetHubKusama')
    expect(result).toEqual([mockDOTAsset, mockKSMAsset])

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
