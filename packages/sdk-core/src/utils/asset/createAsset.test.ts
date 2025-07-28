import type { TAmount, TAsset } from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { addXcmVersionHeader } from '../addXcmVersionHeader'
import { createAsset, createVersionedAssets } from './createAsset'

vi.mock('../addXcmVersionHeader', () => ({
  addXcmVersionHeader: vi.fn()
}))

const mockAmount: TAmount = 1000000000000n
const mockLocation: TLocation = { parents: 1, interior: { X1: { Parachain: 2000 } } }

describe('createAsset', () => {
  it('should create a V4 asset correctly', () => {
    const result = createAsset(Version.V4, mockAmount, mockLocation)
    const expectedAsset: TAsset = {
      id: mockLocation,
      fun: { Fungible: mockAmount }
    }
    expect(result).toEqual(expectedAsset)
  })

  it('should create a V5 asset correctly', () => {
    const result = createAsset(Version.V5, mockAmount, mockLocation)
    const expectedAsset: TAsset = {
      id: mockLocation,
      fun: { Fungible: mockAmount }
    }
    expect(result).toEqual(expectedAsset)
  })

  it('should create a asset with a Concrete id for versions other than V4 or V5', () => {
    const result = createAsset(Version.V3, mockAmount, mockLocation)
    const expectedAsset: TAsset = {
      id: { Concrete: mockLocation },
      fun: { Fungible: mockAmount }
    }
    expect(result).toEqual(expectedAsset)
  })
})

describe('createVersionedAssets', () => {
  it('should create a asset and then add a version header', () => {
    const mockAsset = {
      id: { Concrete: mockLocation },
      fun: { Fungible: mockAmount }
    }

    const expectedVersionedAssets = { V3: [mockAsset] }
    vi.mocked(addXcmVersionHeader).mockReturnValue(expectedVersionedAssets)

    const result = createVersionedAssets(Version.V3, mockAmount, mockLocation)

    expect(addXcmVersionHeader).toHaveBeenCalledWith([mockAsset], Version.V3)
    expect(result).toEqual(expectedVersionedAssets)
  })

  it('should correctly handle V4 assets when creating versioned assets', () => {
    const mockAssetV4 = {
      id: mockLocation,
      fun: { Fungible: mockAmount }
    }

    const expectedVersionedAssets = { V4: [mockAssetV4] }
    vi.mocked(addXcmVersionHeader).mockReturnValue(expectedVersionedAssets)

    const result = createVersionedAssets(Version.V4, mockAmount, mockLocation)

    expect(addXcmVersionHeader).toHaveBeenCalledWith([mockAssetV4], Version.V4)
    expect(result).toEqual(expectedVersionedAssets)
  })
})
