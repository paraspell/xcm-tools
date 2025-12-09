import { extractAssetLocation, type TAsset } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { createAssetsFilter } from './createAssetsFilter'

vi.mock('@paraspell/assets')

describe('createAssetsFilter', () => {
  it('should create a filter with correct structure and call extractAssetLocation', () => {
    const mockAsset = {} as TAsset
    const mockVersion = Version.V3
    const mockLocation = { parents: 1, interior: { X1: { Parachain: 1000 } } }
    vi.mocked(extractAssetLocation).mockReturnValue(mockLocation)

    const result = createAssetsFilter(mockAsset, mockVersion)

    expect(extractAssetLocation).toHaveBeenCalledWith(mockAsset)
    expect(result).toEqual({
      Wild: {
        AllOf: {
          id: { Concrete: mockLocation },
          fun: 'Fungible'
        }
      }
    })
  })
})
