import { describe, expect, it, vi } from 'vitest'

import { CustomAssetConflictError } from '../errors'
import type { TAssetInfo, TCustomAssetInfo } from '../types'
import { mergeCustomAssets, normalizeCustomAssets } from './customAssets'

vi.mock('../maps/assets.json', () => ({
  default: {
    Acala: {
      assets: [
        {
          symbol: 'ACA',
          decimals: 12,
          location: { parents: 1, interior: { X1: { Parachain: 2000 } } },
          isNative: true
        },
        {
          symbol: 'aSEED',
          decimals: 12,
          location: { parents: 1, interior: { X1: { GeneralIndex: '1' } } }
        }
      ]
    },
    Hydration: { assets: [] }
  }
}))

const overlayAsset = (overrides: Partial<TCustomAssetInfo> = {}): TCustomAssetInfo => ({
  symbol: 'CUST',
  decimals: 10,
  location: { parents: 1, interior: { X1: { GeneralIndex: '999' } } },
  ...overrides
})

describe('normalizeCustomAssets', () => {
  it('returns an empty map when input is undefined', () => {
    expect(normalizeCustomAssets(undefined)).toEqual({})
  })

  it('skips chains whose entry list is empty or nullish', () => {
    expect(normalizeCustomAssets({ Acala: [], Hydration: undefined })).toEqual({})
  })

  it('keeps non-colliding entries', () => {
    const entry = overlayAsset()
    const result = normalizeCustomAssets({ Acala: [entry] })
    expect(result).toEqual({ Acala: [entry] })
  })

  it('throws CustomAssetConflictError on location clash with registry asset', () => {
    const entry = overlayAsset({
      symbol: 'ACA2',
      location: { parents: 1, interior: { X1: { Parachain: 2000 } } }
    })
    expect(() => normalizeCustomAssets({ Acala: [entry] })).toThrow(CustomAssetConflictError)
  })

  it('allows colliding entries when forceOverride is set', () => {
    const entry = overlayAsset({
      symbol: 'ACA2',
      forceOverride: true,
      location: { parents: 1, interior: { X1: { Parachain: 2000 } } }
    })
    const result = normalizeCustomAssets({ Acala: [entry] })
    expect(result).toEqual({ Acala: [entry] })
  })

  it('handles a chain that has no base assets registered', () => {
    const entry = overlayAsset()
    const result = normalizeCustomAssets({ Hydration: [entry] })
    expect(result).toEqual({ Hydration: [entry] })
  })
})

describe('mergeCustomAssets', () => {
  const base: TAssetInfo[] = [
    {
      symbol: 'A',
      decimals: 12,
      location: { parents: 0, interior: { X1: { Parachain: 1 } } }
    },
    {
      symbol: 'B',
      decimals: 12,
      location: { parents: 0, interior: { X1: { Parachain: 2 } } }
    }
  ]

  it('returns a copy of base when overlay is undefined', () => {
    const result = mergeCustomAssets(base, undefined)
    expect(result).toEqual(base)
    expect(result).not.toBe(base)
  })

  it('returns a copy of base when overlay is empty', () => {
    const result = mergeCustomAssets(base, [])
    expect(result).toEqual(base)
    expect(result).not.toBe(base)
  })

  it('appends overlay entries that do not clash on location', () => {
    const overlay: TAssetInfo[] = [
      {
        symbol: 'C',
        decimals: 6,
        location: { parents: 0, interior: { X1: { Parachain: 3 } } }
      }
    ]
    expect(mergeCustomAssets(base, overlay)).toEqual([...base, ...overlay])
  })

  it('replaces base entries that overlap with overlay locations', () => {
    const overlay: TAssetInfo[] = [
      {
        symbol: 'A-NEW',
        decimals: 18,
        location: { parents: 0, interior: { X1: { Parachain: 1 } } }
      }
    ]
    const result = mergeCustomAssets(base, overlay)
    expect(result).toEqual([base[1], overlay[0]])
  })
})
