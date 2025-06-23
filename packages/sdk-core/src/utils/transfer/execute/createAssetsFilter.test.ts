import { extractMultiAssetLoc, type TMultiAsset } from '@paraspell/assets'
import { describe, expect, it, vi } from 'vitest'

import { createAssetsFilter } from './createAssetsFilter'

vi.mock('@paraspell/assets', () => ({
  extractMultiAssetLoc: vi.fn()
}))

const mockExtractMultiAssetLoc = vi.mocked(extractMultiAssetLoc)

describe('createAssetsFilter', () => {
  it('should create a filter with correct structure and call extractMultiAssetLoc', () => {
    const mockAsset = {} as TMultiAsset
    const mockLocation = { parents: 1, interior: { X1: { Parachain: 1000 } } }
    mockExtractMultiAssetLoc.mockReturnValue(mockLocation)

    const result = createAssetsFilter(mockAsset)

    expect(mockExtractMultiAssetLoc).toHaveBeenCalledWith(mockAsset)
    expect(result).toEqual({
      Wild: {
        AllOf: {
          id: mockLocation,
          fun: 'Fungible'
        }
      }
    })
  })
})
