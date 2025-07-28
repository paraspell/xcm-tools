import type { TForeignAssetInfo } from '@paraspell/assets'
import { getNativeAssetSymbol, getOtherAssets } from '@paraspell/assets'
import { Parents, type TLocation, type TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { getLocationTokenIdPjs } from './getLocationTokenIdPjs'

vi.mock('@paraspell/assets', () => ({
  getNativeAssetSymbol: vi.fn(),
  getOtherAssets: vi.fn()
}))

describe('getLocationTokenIdPjs', () => {
  const mockNode: TNodeDotKsmWithRelayChains = {} as TNodeDotKsmWithRelayChains

  it('should return the native asset symbol when location.interior is "Here"', () => {
    const location: TLocation = { parents: Parents.ONE, interior: 'Here' }
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')

    const result = getLocationTokenIdPjs(location, mockNode)

    expect(result).toBe('DOT')
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(mockNode)
  })

  it('should return the symbol of a valid foreign asset', () => {
    const location: TLocation = {
      parents: 1,
      interior: {
        X2: [{ PalletInstance: '50' }, { GeneralIndex: '123' }]
      }
    }

    const foreignAssets: TForeignAssetInfo[] = [
      { assetId: '123', symbol: 'USDT' },
      { assetId: '456', symbol: 'ETH' }
    ]

    vi.mocked(getOtherAssets).mockReturnValue(foreignAssets)

    const result = getLocationTokenIdPjs(location, mockNode)

    expect(result).toBe('USDT')
    expect(getOtherAssets).toHaveBeenCalledWith(mockNode)
  })

  it('should return null if foreign asset is not found', () => {
    const location: TLocation = {
      parents: 1,
      interior: {
        X2: [{ PalletInstance: '50' }, { GeneralIndex: '999' }]
      }
    }

    const foreignAssets: TForeignAssetInfo[] = [
      { assetId: '123', symbol: 'USDT' },
      { assetId: '456', symbol: 'ETH' }
    ]

    vi.mocked(getOtherAssets).mockReturnValue(foreignAssets)

    const result = getLocationTokenIdPjs(location, mockNode)

    expect(result).toBeNull()
  })

  it('should return null for unsupported interior structure', () => {
    const location: TLocation = {
      parents: 1,
      interior: {
        X3: [{ PalletInstance: '50' }, { GeneralIndex: '123' }, { GeneralIndex: '456' }]
      }
    }

    const result = getLocationTokenIdPjs(location, mockNode)

    expect(result).toBeNull()
  })

  it('should return null for unsupported pallet instance', () => {
    const location: TLocation = {
      parents: 1,
      interior: {
        X2: [{ PalletInstance: '99' }, { GeneralIndex: '123' }]
      }
    }

    const result = getLocationTokenIdPjs(location, mockNode)

    expect(result).toBeNull()
  })
})
