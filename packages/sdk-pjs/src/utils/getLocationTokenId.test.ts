import type { TAssetInfo } from '@paraspell/sdk-core'
import {
  getNativeAssetSymbol,
  getOtherAssets,
  Parents,
  type TLocation,
  type TSubstrateChain
} from '@paraspell/sdk-core'
import { describe, expect, it, vi } from 'vitest'

import { getLocationTokenId } from './getLocationTokenId'

describe('getLocationTokenId', () => {
  const mockChain: TSubstrateChain = 'Acala'

  it('should return the native asset symbol when location.interior is "Here"', () => {
    const location: TLocation = { parents: Parents.ONE, interior: 'Here' }
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')

    const result = getLocationTokenId(location, mockChain)

    expect(result).toBe('DOT')
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(mockChain)
  })

  it('should return the symbol of a valid foreign asset', () => {
    const location: TLocation = {
      parents: 1,
      interior: {
        X2: [{ PalletInstance: '50' }, { GeneralIndex: '123' }]
      }
    }

    const foreignAssets: TAssetInfo[] = [
      { assetId: '123', symbol: 'USDT', decimals: 6, location },
      { assetId: '456', symbol: 'ETH', decimals: 18, location }
    ]

    vi.mocked(getOtherAssets).mockReturnValue(foreignAssets)

    const result = getLocationTokenId(location, mockChain)

    expect(result).toBe('USDT')
    expect(getOtherAssets).toHaveBeenCalledWith(mockChain)
  })

  it('should return null if foreign asset is not found', () => {
    const location: TLocation = {
      parents: 1,
      interior: {
        X2: [{ PalletInstance: '50' }, { GeneralIndex: '999' }]
      }
    }

    const foreignAssets: TAssetInfo[] = [
      { assetId: '123', symbol: 'USDT', decimals: 6, location },
      { assetId: '456', symbol: 'ETH', decimals: 18, location }
    ]

    vi.mocked(getOtherAssets).mockReturnValue(foreignAssets)

    const result = getLocationTokenId(location, mockChain)
    expect(result).toBeNull()
  })

  it('should return null for unsupported interior structure', () => {
    const location: TLocation = {
      parents: 1,
      interior: {
        X3: [{ PalletInstance: '50' }, { GeneralIndex: '123' }, { GeneralIndex: '456' }]
      }
    }

    const result = getLocationTokenId(location, mockChain)
    expect(result).toBeNull()
  })

  it('should return null for unsupported pallet instance', () => {
    const location: TLocation = {
      parents: 1,
      interior: {
        X2: [{ PalletInstance: '99' }, { GeneralIndex: '123' }]
      }
    }

    const result = getLocationTokenId(location, mockChain)
    expect(result).toBeNull()
  })
})
