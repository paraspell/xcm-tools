/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { type TMultiAsset } from '@paraspell/assets'
import { type TMultiLocation } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { sortMultiAssets } from './sortMultiAssets'

vi.mock('@paraspell/assets', () => ({
  extractMultiAssetLoc: vi.fn((asset: TMultiAsset) => {
    if ('Concrete' in asset.id) {
      return asset.id.Concrete
    }
    return asset.id
  })
}))

vi.mock('@paraspell/sdk-common', () => ({
  hasJunction: vi.fn((loc: TMultiLocation, junction: string) => {
    if (junction === 'GlobalConsensus' && loc.interior && typeof loc.interior === 'object') {
      if ('X2' in loc.interior && Array.isArray(loc.interior.X2)) {
        const firstJunction = loc.interior.X2[0]
        return (
          firstJunction && typeof firstJunction === 'object' && 'GlobalConsensus' in firstJunction
        )
      }
    }
    return false
  }),
  getJunctionValue: vi.fn((loc: TMultiLocation, junction: string) => {
    if (junction === 'GeneralIndex' && loc.interior && typeof loc.interior === 'object') {
      if ('X1' in loc.interior && 'GeneralIndex' in (loc.interior.X1 || {})) {
        return (loc.interior.X1 as any).GeneralIndex
      }
      if (
        'X2' in loc.interior &&
        loc.interior.X2?.[1] &&
        'GeneralIndex' in (loc.interior.X2[1] || {})
      ) {
        return (loc.interior.X2[1] as any).GeneralIndex
      }
    }
    return undefined
  })
}))

describe('sortMultiAssets', () => {
  const createAsset = (location: TMultiLocation): TMultiAsset => ({
    id: { Concrete: location },
    fun: { Fungible: '1000' }
  })

  const getLocation = (asset: TMultiAsset): TMultiLocation => {
    if ('Concrete' in asset.id) {
      return asset.id.Concrete
    }
    return asset.id
  }

  describe('sorting by parents', () => {
    it('sorts assets with different parent counts', () => {
      const assets: TMultiAsset[] = [
        createAsset({ parents: 2, interior: 'Here' }),
        createAsset({ parents: 0, interior: 'Here' }),
        createAsset({ parents: 1, interior: 'Here' })
      ]

      const sorted = sortMultiAssets([...assets])

      expect(getLocation(sorted[0]).parents).toBe(0)
      expect(getLocation(sorted[1]).parents).toBe(1)
      expect(getLocation(sorted[2]).parents).toBe(2)
    })
  })

  describe('sorting by location type (same parents)', () => {
    it('prioritizes Here locations first', () => {
      const assets: TMultiAsset[] = [
        createAsset({ parents: 1, interior: { X1: { Parachain: 2000 } } }),
        createAsset({ parents: 1, interior: 'Here' }),
        createAsset({
          parents: 1,
          interior: { X2: [{ GlobalConsensus: 'Polkadot' }, { Parachain: 1000 }] }
        })
      ]

      const sorted = sortMultiAssets([...assets])

      expect(getLocation(sorted[0]).interior).toBe('Here')
    })

    it('handles Here as object format', () => {
      const assets: TMultiAsset[] = [
        createAsset({ parents: 1, interior: { X1: { Parachain: 2000 } } }),
        createAsset({ parents: 1, interior: { Here: null } }),
        createAsset({
          parents: 1,
          interior: { X2: [{ GlobalConsensus: 'Polkadot' }, { Parachain: 1000 }] }
        })
      ]

      const sorted = sortMultiAssets([...assets])

      expect(getLocation(sorted[0]).interior).toEqual({ Here: null })
    })

    it('prioritizes non-GlobalConsensus over GlobalConsensus', () => {
      const assets: TMultiAsset[] = [
        createAsset({
          parents: 1,
          interior: { X2: [{ GlobalConsensus: 'Polkadot' }, { Parachain: 1000 }] }
        }),
        createAsset({ parents: 1, interior: { X1: { Parachain: 2000 } } })
      ]

      const sorted = sortMultiAssets([...assets])

      expect(getLocation(sorted[0]).interior).toEqual({ X1: { Parachain: 2000 } })
      expect(getLocation(sorted[1]).interior).toEqual({
        X2: [{ GlobalConsensus: 'Polkadot' }, { Parachain: 1000 }]
      })
    })
  })

  describe('sorting by GeneralIndex (same parents and priority)', () => {
    it('sorts assets by GeneralIndex value', () => {
      const assets: TMultiAsset[] = [
        createAsset({ parents: 1, interior: { X1: { GeneralIndex: 30 } } }),
        createAsset({ parents: 1, interior: { X1: { GeneralIndex: 10 } } }),
        createAsset({ parents: 1, interior: { X1: { GeneralIndex: 20 } } })
      ]

      const sorted = sortMultiAssets([...assets])

      expect(getLocation(sorted[0]).interior).toEqual({ X1: { GeneralIndex: 10 } })
      expect(getLocation(sorted[1]).interior).toEqual({ X1: { GeneralIndex: 20 } })
      expect(getLocation(sorted[2]).interior).toEqual({ X1: { GeneralIndex: 30 } })
    })

    it('places assets without GeneralIndex after those with GeneralIndex', () => {
      const assets: TMultiAsset[] = [
        createAsset({ parents: 1, interior: { X1: { Parachain: 2000 } } }),
        createAsset({ parents: 1, interior: { X1: { GeneralIndex: 10 } } }),
        createAsset({ parents: 1, interior: { X1: { GeneralIndex: 20 } } })
      ]

      const sorted = sortMultiAssets([...assets])

      expect(getLocation(sorted[0]).interior).toEqual({ X1: { GeneralIndex: 10 } })
      expect(getLocation(sorted[1]).interior).toEqual({ X1: { GeneralIndex: 20 } })
      expect(getLocation(sorted[2]).interior).toEqual({ X1: { Parachain: 2000 } })
    })

    it('maintains order when both assets have no GeneralIndex', () => {
      const assets: TMultiAsset[] = [
        createAsset({ parents: 1, interior: { X1: { Parachain: 2000 } } }),
        createAsset({ parents: 1, interior: { X1: { Parachain: 1000 } } })
      ]

      const sorted = sortMultiAssets([...assets])

      // Should maintain relative order when priorities are equal and no GeneralIndex
      expect(sorted).toEqual(assets)
    })
  })

  describe('complex sorting scenarios', () => {
    it('sorts complex mix of assets correctly', () => {
      const assets: TMultiAsset[] = [
        // Group 1: parents=0
        createAsset({ parents: 0, interior: { X1: { GeneralIndex: 50 } } }),
        createAsset({ parents: 0, interior: 'Here' }),

        // Group 2: parents=1
        createAsset({
          parents: 1,
          interior: { X2: [{ GlobalConsensus: 'Kusama' }, { Parachain: 2000 }] }
        }),
        createAsset({ parents: 1, interior: { X1: { GeneralIndex: 10 } } }),
        createAsset({ parents: 1, interior: 'Here' }),
        createAsset({ parents: 1, interior: { X1: { GeneralIndex: 30 } } }),

        // Group 3: parents=2
        createAsset({ parents: 2, interior: { X1: { Parachain: 1000 } } })
      ]

      const sorted = sortMultiAssets([...assets])

      // Check parents=0 group
      expect(getLocation(sorted[0]).parents).toBe(0)
      expect(getLocation(sorted[0]).interior).toBe('Here') // Here has priority 0
      expect(getLocation(sorted[1]).parents).toBe(0)
      expect(getLocation(sorted[1]).interior).toEqual({ X1: { GeneralIndex: 50 } })

      expect(getLocation(sorted[2]).parents).toBe(1)
      expect(getLocation(sorted[2]).interior).toBe('Here')
      expect(getLocation(sorted[3]).parents).toBe(1)
      expect(getLocation(sorted[3]).interior).toEqual({ X1: { GeneralIndex: 10 } })
      expect(getLocation(sorted[4]).parents).toBe(1)
      expect(getLocation(sorted[4]).interior).toEqual({ X1: { GeneralIndex: 30 } })
      expect(getLocation(sorted[5]).parents).toBe(1)
      expect(getLocation(sorted[5]).interior).toEqual({
        X2: [{ GlobalConsensus: 'Kusama' }, { Parachain: 2000 }]
      })

      expect(getLocation(sorted[6]).parents).toBe(2)
    })
  })

  describe('edge cases', () => {
    it('handles empty array', () => {
      const result = sortMultiAssets([])
      expect(result).toEqual([])
    })

    it('handles single element array', () => {
      const assets = [createAsset({ parents: 1, interior: 'Here' })]
      const result = sortMultiAssets([...assets])
      expect(result).toEqual(assets)
    })

    it('mutates the original array', () => {
      const assets: TMultiAsset[] = [
        createAsset({ parents: 2, interior: 'Here' }),
        createAsset({ parents: 1, interior: 'Here' })
      ]

      const result = sortMultiAssets(assets)

      expect(result).toBe(assets)
      expect(getLocation(assets[0]).parents).toBe(1)
    })
  })

  describe('GeneralIndex in X2 locations', () => {
    it('sorts by GeneralIndex in X2 second position', () => {
      const assets: TMultiAsset[] = [
        createAsset({ parents: 1, interior: { X2: [{ Parachain: 1000 }, { GeneralIndex: 30 }] } }),
        createAsset({ parents: 1, interior: { X2: [{ Parachain: 1000 }, { GeneralIndex: 10 }] } }),
        createAsset({ parents: 1, interior: { X2: [{ Parachain: 1000 }, { GeneralIndex: 20 }] } })
      ]

      const sorted = sortMultiAssets([...assets])

      const loc0 = getLocation(sorted[0]).interior as any
      const loc1 = getLocation(sorted[1]).interior as any
      const loc2 = getLocation(sorted[2]).interior as any

      expect(loc0.X2[1].GeneralIndex).toBe(10)
      expect(loc1.X2[1].GeneralIndex).toBe(20)
      expect(loc2.X2[1].GeneralIndex).toBe(30)
    })
  })
})
