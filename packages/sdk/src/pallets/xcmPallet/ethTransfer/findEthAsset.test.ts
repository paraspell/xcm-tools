import { describe, it, expect, vi } from 'vitest'
import { getOtherAssets } from '../../assets'
import { findEthAsset } from './findEthAsset'

vi.mock('../../assets', () => ({
  getOtherAssets: vi.fn()
}))

describe('findEthAsset', () => {
  it('returns the correct asset for a valid currency', () => {
    const mockAssets = [
      { symbol: 'WETH', assetId: '0x123' },
      { symbol: 'WBTC', assetId: '0x234' }
    ]
    vi.mocked(getOtherAssets).mockReturnValue(mockAssets)

    const asset = findEthAsset('WETH')
    expect(asset).toEqual({ symbol: 'WETH', assetId: '0x123' })
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
  })

  it('throws InvalidCurrencyError for an unsupported currency', () => {
    const mockAssets = [
      { symbol: 'WETH', assetId: '0x123' },
      { symbol: 'WBTC', assetId: '0x234' }
    ]
    vi.mocked(getOtherAssets).mockReturnValue(mockAssets)

    const testFunc = () => findEthAsset('WDOGE')
    expect(testFunc).toThrow(Error)
    expect(testFunc).toThrow('Currency WDOGE is not supported for Ethereum transfers')
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
  })

  it('throws InvalidCurrencyError when no assets are available', () => {
    vi.mocked(getOtherAssets).mockReturnValue([])

    const testFunc = () => findEthAsset('WETH')
    expect(testFunc).toThrow(Error)
    expect(testFunc).toThrow('Currency WETH is not supported for Ethereum transfers')
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
  })
})
