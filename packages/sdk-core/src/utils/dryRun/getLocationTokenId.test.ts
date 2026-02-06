import type { TAssetInfo } from '@paraspell/assets'
import { getNativeAssetSymbol, getOtherAssets } from '@paraspell/assets'
import type { TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { getLocationTokenId } from './getLocationTokenId'

vi.mock('@paraspell/assets')

describe('getLocationTokenId', () => {
  const mockChain: TSubstrateChain = 'Acala'

  const location: TLocation = {
    parents: 1,
    interior: {
      X1: [{ Parachain: 1000 }]
    }
  }

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
    const locationPapi = {
      interior: {
        type: 'X2',
        value: [
          { type: 'PalletInstance', value: 50 },
          { type: 'GeneralIndex', value: '123' }
        ]
      }
    }

    const foreignAssets: TAssetInfo[] = [
      { assetId: '123', symbol: 'USDT', decimals: 6, location },
      { assetId: '456', symbol: 'ETH', decimals: 18, location }
    ]

    vi.mocked(getOtherAssets).mockReturnValue(foreignAssets)

    const result = getLocationTokenId(locationPapi, mockChain)

    expect(result).toBe('123')
    expect(getOtherAssets).toHaveBeenCalledWith(mockChain)
  })

  it('should return null if the foreign asset is not found', () => {
    const locationPapi = {
      interior: {
        type: 'X2',
        value: [
          { type: 'PalletInstance', value: 50 },
          { type: 'GeneralIndex', value: '999' }
        ]
      }
    }

    const foreignAssets: TAssetInfo[] = [
      { assetId: '123', symbol: 'USDT', decimals: 6, location },
      { assetId: '456', symbol: 'ETH', decimals: 18, location }
    ]

    vi.mocked(getOtherAssets).mockReturnValue(foreignAssets)

    const result = getLocationTokenId(locationPapi, mockChain)

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
