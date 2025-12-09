import type { TAssetInfo } from '@paraspell/assets'
import { getNativeAssetSymbol, getOtherAssets } from '@paraspell/assets'
import { Parents, type TLocation, type TSubstrateChain } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { getLocationTokenIdPjs } from './getLocationTokenIdPjs'

vi.mock('@paraspell/assets')

describe('getLocationTokenIdPjs', () => {
  const mockChain = {} as TSubstrateChain

  it('should return the native asset symbol when location.interior is "Here"', () => {
    const location: TLocation = { parents: Parents.ONE, interior: 'Here' }
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')

    const result = getLocationTokenIdPjs(location, mockChain)

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
      { assetId: '123', symbol: 'USDT', decimals: 6 },
      { assetId: '456', symbol: 'ETH', decimals: 18 }
    ]

    vi.mocked(getOtherAssets).mockReturnValue(foreignAssets)

    const result = getLocationTokenIdPjs(location, mockChain)

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
      { assetId: '123', symbol: 'USDT', decimals: 6 },
      { assetId: '456', symbol: 'ETH', decimals: 18 }
    ]

    vi.mocked(getOtherAssets).mockReturnValue(foreignAssets)

    const result = getLocationTokenIdPjs(location, mockChain)

    expect(result).toBeNull()
  })

  it('should return null for unsupported interior structure', () => {
    const location: TLocation = {
      parents: 1,
      interior: {
        X3: [{ PalletInstance: '50' }, { GeneralIndex: '123' }, { GeneralIndex: '456' }]
      }
    }

    const result = getLocationTokenIdPjs(location, mockChain)

    expect(result).toBeNull()
  })

  it('should return null for unsupported pallet instance', () => {
    const location: TLocation = {
      parents: 1,
      interior: {
        X2: [{ PalletInstance: '99' }, { GeneralIndex: '123' }]
      }
    }

    const result = getLocationTokenIdPjs(location, mockChain)

    expect(result).toBeNull()
  })
})
