import type { TForeignAsset } from '@paraspell/assets'
import { getNativeAssetSymbol, getOtherAssets } from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { getMultiLocationTokenId } from './getMultiLocationTokenId'

vi.mock('@paraspell/assets', () => ({
  getNativeAssetSymbol: vi.fn(),
  getOtherAssets: vi.fn()
}))

describe('getMultiLocationTokenId', () => {
  const mockNode: TNodeDotKsmWithRelayChains = {} as TNodeDotKsmWithRelayChains

  it('should return the native asset symbol when location interior type is "Here"', () => {
    const location = {
      interior: {
        type: 'Here'
      }
    }

    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')

    const result = getMultiLocationTokenId(location, mockNode)

    expect(result).toBe('DOT')
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(mockNode)
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

    const foreignAssets: TForeignAsset[] = [
      { assetId: '123', symbol: 'USDT' },
      { assetId: '456', symbol: 'ETH' }
    ]

    vi.mocked(getOtherAssets).mockReturnValue(foreignAssets)

    const result = getMultiLocationTokenId(location, mockNode)

    expect(result).toBe('123')
    expect(getOtherAssets).toHaveBeenCalledWith(mockNode)
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

    const foreignAssets: TForeignAsset[] = [
      { assetId: '123', symbol: 'USDT' },
      { assetId: '456', symbol: 'ETH' }
    ]

    vi.mocked(getOtherAssets).mockReturnValue(foreignAssets)

    const result = getMultiLocationTokenId(location, mockNode)

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

    const result = getMultiLocationTokenId(location, mockNode)

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

    const result = getMultiLocationTokenId(location, mockNode)

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

    const result = getMultiLocationTokenId(location, mockNode)

    expect(result).toBeNull()
  })
})
