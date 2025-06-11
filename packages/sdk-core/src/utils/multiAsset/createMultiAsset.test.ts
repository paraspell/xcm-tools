import type { TAmount, TMultiAsset } from '@paraspell/assets'
import type { TMultiLocation } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { addXcmVersionHeader } from '../addXcmVersionHeader'
import { createMultiAsset, createVersionedMultiAssets } from './createMultiAsset'

vi.mock('../addXcmVersionHeader', () => ({
  addXcmVersionHeader: vi.fn()
}))

describe('MultiAsset Creation', () => {
  const mockAmount: TAmount = '1000000000000'
  const mockMultiLocation: TMultiLocation = { parents: 1, interior: { X1: { Parachain: 2000 } } }

  describe('createMultiAsset', () => {
    it('should create a V4 multi-asset correctly', () => {
      const result = createMultiAsset(Version.V4, mockAmount, mockMultiLocation)
      const expectedAsset: TMultiAsset = {
        id: mockMultiLocation,
        fun: { Fungible: mockAmount }
      }
      expect(result).toEqual(expectedAsset)
    })

    it('should create a V5 multi-asset correctly', () => {
      const result = createMultiAsset(Version.V5, mockAmount, mockMultiLocation)
      const expectedAsset: TMultiAsset = {
        id: mockMultiLocation,
        fun: { Fungible: mockAmount }
      }
      expect(result).toEqual(expectedAsset)
    })

    it('should create a multi-asset with a Concrete id for versions other than V4 or V5', () => {
      const result = createMultiAsset(Version.V3, mockAmount, mockMultiLocation)
      const expectedAsset: TMultiAsset = {
        id: { Concrete: mockMultiLocation },
        fun: { Fungible: mockAmount }
      }
      expect(result).toEqual(expectedAsset)
    })
  })

  describe('createVersionedMultiAssets', () => {
    it('should create a multi-asset and then add a version header', () => {
      const mockMultiAsset = {
        id: { Concrete: mockMultiLocation },
        fun: { Fungible: mockAmount }
      }

      const expectedVersionedAssets = { V3: [mockMultiAsset] }
      vi.mocked(addXcmVersionHeader).mockReturnValue(expectedVersionedAssets)

      const result = createVersionedMultiAssets(Version.V3, mockAmount, mockMultiLocation)

      expect(addXcmVersionHeader).toHaveBeenCalledWith([mockMultiAsset], Version.V3)
      expect(result).toEqual(expectedVersionedAssets)
    })

    it('should correctly handle V4 assets when creating versioned assets', () => {
      const mockV4MultiAsset = {
        id: mockMultiLocation,
        fun: { Fungible: mockAmount }
      }

      const expectedVersionedAssets = { V4: [mockV4MultiAsset] }
      vi.mocked(addXcmVersionHeader).mockReturnValue(expectedVersionedAssets)

      const result = createVersionedMultiAssets(Version.V4, mockAmount, mockMultiLocation)

      expect(addXcmVersionHeader).toHaveBeenCalledWith([mockV4MultiAsset], Version.V4)
      expect(result).toEqual(expectedVersionedAssets)
    })
  })
})
