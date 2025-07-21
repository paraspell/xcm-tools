import { beforeEach } from 'node:test'

import type { TAmount, TMultiAsset } from '@paraspell/assets'
import type { TMultiLocation } from '@paraspell/sdk-common'
import { isTMultiLocation, Version } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { InvalidParameterError } from '../../errors'
import { createMultiAsset } from './createMultiAsset'
import { maybeOverrideMultiAsset, maybeOverrideMultiAssets } from './overrideMultiAsset'

vi.mock('@paraspell/sdk-common', async importOriginal => {
  const actual = await importOriginal<typeof import('@paraspell/sdk-common')>()
  return {
    ...actual,
    isTMultiLocation: vi.fn()
  }
})

vi.mock('./createMultiAsset', () => ({
  createMultiAsset: vi.fn()
}))

describe('MultiAsset Override Logic', () => {
  const mockVersion = Version.V4
  const mockAmount: TAmount = 1000000000000n
  const mockMultiLocation: TMultiLocation = { parents: 1, interior: { X1: { Parachain: 2000 } } }
  const mockMultiAsset: TMultiAsset = {
    id: { Concrete: mockMultiLocation },
    fun: { Fungible: mockAmount }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('maybeOverrideMultiAssets', () => {
    it('should return original assets if no override is provided', () => {
      const originalAssets = [mockMultiAsset]
      const result = maybeOverrideMultiAssets(mockVersion, mockAmount, originalAssets)
      expect(result).toEqual(originalAssets)
    })

    it('should return a new asset array if override is a TMultiLocation', () => {
      const newAsset = { id: { Concrete: mockMultiLocation }, fun: { Fungible: 500n } }
      vi.mocked(isTMultiLocation).mockReturnValue(true)
      vi.mocked(createMultiAsset).mockReturnValue(newAsset)

      const result = maybeOverrideMultiAssets(
        mockVersion,
        mockAmount,
        [mockMultiAsset],
        mockMultiLocation
      )

      expect(isTMultiLocation).toHaveBeenCalledWith(mockMultiLocation)
      expect(createMultiAsset).toHaveBeenCalledWith(mockVersion, mockAmount, mockMultiLocation)
      expect(result).toEqual([newAsset])
    })

    it('should return the provided asset array if override is a TMultiAsset[]', () => {
      const overrideAssets = [{ id: { Concrete: mockMultiLocation }, fun: { Fungible: 200n } }]
      vi.mocked(createMultiAsset).mockReset()
      vi.mocked(isTMultiLocation).mockReturnValue(false)

      const result = maybeOverrideMultiAssets(
        mockVersion,
        mockAmount,
        [mockMultiAsset],
        overrideAssets
      )

      expect(isTMultiLocation).toHaveBeenCalledWith(overrideAssets)
      expect(result).toEqual(overrideAssets)
      expect(createMultiAsset).not.toHaveBeenCalled()
    })
  })

  describe('maybeOverrideMultiAsset', () => {
    it('should return the original asset if no override is provided', () => {
      const result = maybeOverrideMultiAsset(mockVersion, mockAmount, mockMultiAsset)
      expect(result).toEqual(mockMultiAsset)
    })

    it('should return a new asset if override is a TMultiLocation', () => {
      const newAsset = { id: { Concrete: mockMultiLocation }, fun: { Fungible: 500n } }
      vi.mocked(createMultiAsset).mockReturnValue(newAsset)

      const result = maybeOverrideMultiAsset(
        mockVersion,
        mockAmount,
        mockMultiAsset,
        mockMultiLocation
      )

      expect(createMultiAsset).toHaveBeenCalledWith(mockVersion, mockAmount, mockMultiLocation)
      expect(result).toEqual(newAsset)
    })

    it('should return the single asset from the array if override is a TMultiAsset[] with one item', () => {
      const overrideAsset = { id: { Concrete: mockMultiLocation }, fun: { Fungible: 300n } }
      const result = maybeOverrideMultiAsset(mockVersion, mockAmount, mockMultiAsset, [
        overrideAsset
      ])
      expect(result).toEqual(overrideAsset)
    })

    it('should throw InvalidParameterError if override array contains more than one asset', () => {
      const overrideAssets = [mockMultiAsset, mockMultiAsset]
      const action = () =>
        maybeOverrideMultiAsset(mockVersion, mockAmount, mockMultiAsset, overrideAssets)

      expect(action).toThrow(InvalidParameterError)
      expect(action).toThrow('Expected a single TMultiAsset in overriddenCurrency array.')
    })

    it('should throw InvalidParameterError if override array is empty', () => {
      const overrideAssets: TMultiAsset[] = []
      const action = () =>
        maybeOverrideMultiAsset(mockVersion, mockAmount, mockMultiAsset, overrideAssets)

      expect(action).toThrow(InvalidParameterError)
      expect(action).toThrow('Expected a single TMultiAsset in overriddenCurrency array.')
    })
  })
})
