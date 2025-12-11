import type { TAmount, TAsset } from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { isTLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OverrideConflictError } from '../../errors'
import { createAsset } from './createAsset'
import { maybeOverrideAsset, maybeOverrideAssets } from './overrideAsset'

vi.mock('@paraspell/sdk-common', async importOriginal => {
  const actual = await importOriginal<typeof import('@paraspell/sdk-common')>()
  return {
    ...actual,
    isTLocation: vi.fn()
  }
})

vi.mock('./createAsset', () => ({
  createAsset: vi.fn()
}))

describe('Asset Override Logic', () => {
  const mockVersion = Version.V4
  const mockAmount: TAmount = 1000000000000n
  const mockLocation: TLocation = { parents: 1, interior: { X1: { Parachain: 2000 } } }
  const mockAsset: TAsset = {
    id: { Concrete: mockLocation },
    fun: { Fungible: mockAmount }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('maybeOverrideMultiAssets', () => {
    it('should return original assets if no override is provided', () => {
      const originalAssets = [mockAsset]
      const result = maybeOverrideAssets(mockVersion, mockAmount, originalAssets)
      expect(result).toEqual(originalAssets)
    })

    it('should return a new asset object if override is a TLocation', () => {
      const newAsset = { id: { Concrete: mockLocation }, fun: { Fungible: 500n } }
      vi.mocked(isTLocation).mockReturnValue(true)
      vi.mocked(createAsset).mockReturnValue(newAsset)

      const result = maybeOverrideAssets(mockVersion, mockAmount, [mockAsset], mockLocation)

      expect(isTLocation).toHaveBeenCalledWith(mockLocation)
      expect(createAsset).toHaveBeenCalledWith(mockVersion, mockAmount, mockLocation)
      expect(result).toEqual(newAsset)
    })

    it('should return the provided asset array if override is a TMultiAsset[]', () => {
      const overrideAssets = [{ id: { Concrete: mockLocation }, fun: { Fungible: 200n } }]
      vi.mocked(createAsset).mockReset()
      vi.mocked(isTLocation).mockReturnValue(false)

      const result = maybeOverrideAssets(mockVersion, mockAmount, [mockAsset], overrideAssets)

      expect(isTLocation).toHaveBeenCalledWith(overrideAssets)
      expect(result).toEqual(overrideAssets)
      expect(createAsset).not.toHaveBeenCalled()
    })
  })

  describe('maybeOverrideMultiAsset', () => {
    it('should return the original asset if no override is provided', () => {
      const result = maybeOverrideAsset(mockVersion, mockAmount, mockAsset)
      expect(result).toEqual(mockAsset)
    })

    it('should return a new asset if override is a TLocation', () => {
      const newAsset = { id: { Concrete: mockLocation }, fun: { Fungible: 500n } }
      vi.mocked(createAsset).mockReturnValue(newAsset)

      const result = maybeOverrideAsset(mockVersion, mockAmount, mockAsset, mockLocation)

      expect(createAsset).toHaveBeenCalledWith(mockVersion, mockAmount, mockLocation)
      expect(result).toEqual(newAsset)
    })

    it('should return the single asset from the array if override is a TAsset[] with one item', () => {
      const overrideAsset = { id: { Concrete: mockLocation }, fun: { Fungible: 300n } }
      const result = maybeOverrideAsset(mockVersion, mockAmount, mockAsset, [overrideAsset])
      expect(result).toEqual(overrideAsset)
    })

    it('should throw OverrideConflictError if override array contains more than one asset', () => {
      const overrideAssets = [mockAsset, mockAsset]
      const action = () => maybeOverrideAsset(mockVersion, mockAmount, mockAsset, overrideAssets)

      expect(action).toThrow(OverrideConflictError)
      expect(action).toThrow('Expected a single asset in overriddenCurrency array.')
    })

    it('should throw OverrideConflictError if override array is empty', () => {
      const overrideAssets: TAsset[] = []
      const action = () => maybeOverrideAsset(mockVersion, mockAmount, mockAsset, overrideAssets)

      expect(action).toThrow(OverrideConflictError)
      expect(action).toThrow('Expected a single asset in overriddenCurrency array.')
    })
  })
})
