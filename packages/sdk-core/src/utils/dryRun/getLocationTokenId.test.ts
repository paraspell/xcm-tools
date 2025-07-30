import type { TForeignAssetInfo } from '@paraspell/assets'
import { getNativeAssetSymbol, getOtherAssets } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { getLocationTokenId } from './getLocationTokenId'

vi.mock('@paraspell/assets', () => ({
  getNativeAssetSymbol: vi.fn(),
  getOtherAssets: vi.fn()
}))

describe('getLocationTokenId', () => {
  const mockChain = {} as TSubstrateChain

  it('should return the native asset symbol when location interior type is "Here"', () => {
    const location = {
      interior: {
        type: 'Here'
      }
    }

    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')

    const result = getLocationTokenId(location, mockChain)

    expect(result).toBe('DOT')
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(mockChain)
  })

  it('should return the asset ID of a valid foreign asset', () => {
    const location = {
      interior: {
        type: 'X2',
        value: [
          { type: 'PalletInstance', value: 50 },
          { type: 'GeneralIndex', value: '123' }
        ]
      }
    }

    const foreignAssets: TForeignAssetInfo[] = [
      { assetId: '123', symbol: 'USDT' },
      { assetId: '456', symbol: 'ETH' }
    ]

    vi.mocked(getOtherAssets).mockReturnValue(foreignAssets)

    const result = getLocationTokenId(location, mockChain)

    expect(result).toBe('123')
    expect(getOtherAssets).toHaveBeenCalledWith(mockChain)
  })

  it('should return null if the foreign asset is not found', () => {
    const location = {
      interior: {
        type: 'X2',
        value: [
          { type: 'PalletInstance', value: 50 },
          { type: 'GeneralIndex', value: '999' }
        ]
      }
    }

    const foreignAssets: TForeignAssetInfo[] = [
      { assetId: '123', symbol: 'USDT' },
      { assetId: '456', symbol: 'ETH' }
    ]

    vi.mocked(getOtherAssets).mockReturnValue(foreignAssets)

    const result = getLocationTokenId(location, mockChain)

    expect(result).toBeNull()
  })

  it('should return null for unsupported interior type', () => {
    const location = {
      interior: {
        type: 'X3',
        value: [
          { type: 'PalletInstance', value: 50 },
          { type: 'GeneralIndex', value: '123' }
        ]
      }
    }

    const result = getLocationTokenId(location, mockChain)

    expect(result).toBeNull()
  })

  it('should return null if PalletInstance value is not 50', () => {
    const location = {
      interior: {
        type: 'X2',
        value: [
          { type: 'PalletInstance', value: 99 },
          { type: 'GeneralIndex', value: '123' }
        ]
      }
    }

    const result = getLocationTokenId(location, mockChain)

    expect(result).toBeNull()
  })

  it('should return null if GeneralIndex is missing or invalid', () => {
    const location = {
      interior: {
        type: 'X2',
        value: [
          { type: 'PalletInstance', value: 50 },
          { type: 'InvalidIndex', value: '123' } // Invalid type
        ]
      }
    }

    const result = getLocationTokenId(location, mockChain)

    expect(result).toBeNull()
  })
})
