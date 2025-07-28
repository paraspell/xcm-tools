import { extractAssetLocation, type TAsset } from '@paraspell/assets'
import { describe, expect, it, vi } from 'vitest'

import { createAssetsFilter } from './createAssetsFilter'

vi.mock('@paraspell/assets', () => ({
  extractAssetLocation: vi.fn()
}))

describe('createAssetsFilter', () => {
  it('should create a filter with correct structure and call extractAssetLocation', () => {
    const mockAsset = {} as TAsset
    const mockLocation = { parents: 1, interior: { X1: { Parachain: 1000 } } }
    vi.mocked(extractAssetLocation).mockReturnValue(mockLocation)

    const result = createAssetsFilter(mockAsset)

    expect(extractAssetLocation).toHaveBeenCalledWith(mockAsset)
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
