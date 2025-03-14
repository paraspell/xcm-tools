import type { TForeignAsset } from '@paraspell/assets'
import { getNativeAssetSymbol, getOtherAssets } from '@paraspell/assets'
import type { TMultiLocation, TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { getMultiLocationTokenIdPjs } from './getMultiLocationTokenIdPjs'

vi.mock('@paraspell/assets', () => ({
  getNativeAssetSymbol: vi.fn(),
  getOtherAssets: vi.fn()
}))

describe('getMultiLocationTokenIdPjs', () => {
  const mockNode: TNodeDotKsmWithRelayChains = {} as TNodeDotKsmWithRelayChains

  it('should return the native asset symbol when location.interior is "Here"', () => {
    const location: TMultiLocation = { interior: 'Here' } as TMultiLocation
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')

    const result = getMultiLocationTokenIdPjs(location, mockNode)

    expect(result).toBe('DOT')
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(mockNode)
  })

  it('should return the symbol of a valid foreign asset', () => {
    const location: TMultiLocation = {
      parents: 1,
      interior: {
        X2: [{ PalletInstance: '50' }, { GeneralIndex: '123' }]
      }
    } as TMultiLocation

    const foreignAssets: TForeignAsset[] = [
      { assetId: '123', symbol: 'USDT' },
      { assetId: '456', symbol: 'ETH' }
    ]

    vi.mocked(getOtherAssets).mockReturnValue(foreignAssets)

    const result = getMultiLocationTokenIdPjs(location, mockNode)

    expect(result).toBe('USDT')
    expect(getOtherAssets).toHaveBeenCalledWith(mockNode)
  })

  it('should return null if foreign asset is not found', () => {
    const location: TMultiLocation = {
      parents: 1,
      interior: {
        X2: [{ PalletInstance: '50' }, { GeneralIndex: '999' }]
      }
    } as TMultiLocation

    const foreignAssets: TForeignAsset[] = [
      { assetId: '123', symbol: 'USDT' },
      { assetId: '456', symbol: 'ETH' }
    ]

    vi.mocked(getOtherAssets).mockReturnValue(foreignAssets)

    const result = getMultiLocationTokenIdPjs(location, mockNode)

    expect(result).toBeNull()
  })

  it('should return null for unsupported interior structure', () => {
    const location: TMultiLocation = {
      parents: 1,
      interior: {
        X3: [{ PalletInstance: '50' }, { GeneralIndex: '123' }, { GeneralIndex: '456' }]
      }
    } as TMultiLocation

    const result = getMultiLocationTokenIdPjs(location, mockNode)

    expect(result).toBeNull()
  })

  it('should return null for unsupported pallet instance', () => {
    const location: TMultiLocation = {
      parents: 1,
      interior: {
        X2: [{ PalletInstance: '99' }, { GeneralIndex: '123' }]
      }
    } as TMultiLocation

    const result = getMultiLocationTokenIdPjs(location, mockNode)

    expect(result).toBeNull()
  })
})
