import { describe, it, expect, vi } from 'vitest'
import { findEthAsset } from './findEthAsset'
import { getOtherAssets } from '@paraspell/sdk-core'

vi.mock('@paraspell/sdk-core', () => ({
  getOtherAssets: vi.fn()
}))

describe('findEthAsset', () => {
  it('returns the correct asset for a valid currency', () => {
    const mockAssets = [
      { symbol: 'WETH', assetId: '0x123' },
      { symbol: 'WBTC', assetId: '0x234' }
    ]
    vi.mocked(getOtherAssets).mockReturnValue(mockAssets)

    const asset = findEthAsset({ symbol: 'WETH' })
    expect(asset).toEqual({ symbol: 'WETH', assetId: '0x123' })
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
  })

  it('returns the correct asset for a valid currency using id', () => {
    const mockAssets = [
      { symbol: 'WETH', assetId: '0x123' },
      { symbol: 'WBTC', assetId: '0x234' }
    ]
    vi.mocked(getOtherAssets).mockReturnValue(mockAssets)

    const asset = findEthAsset({ id: '0x123' })
    expect(asset).toEqual({ symbol: 'WETH', assetId: '0x123' })
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
  })

  it('throws InvalidCurrencyError for an unsupported currency', () => {
    const mockAssets = [
      { symbol: 'WETH', assetId: '0x123' },
      { symbol: 'WBTC', assetId: '0x234' }
    ]
    vi.mocked(getOtherAssets).mockReturnValue(mockAssets)

    const testFunc = () => findEthAsset({ symbol: 'WDOGE' })
    expect(testFunc).toThrow(Error)
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
  })

  it('throws InvalidCurrencyError when no assets are available', () => {
    vi.mocked(getOtherAssets).mockReturnValue([])

    const testFunc = () => findEthAsset({ symbol: 'WETH' })
    expect(testFunc).toThrow(Error)
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
  })
})
