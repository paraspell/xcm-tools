import { deepEqual } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isForeignAsset } from '../guards'
import type { TAsset } from '../types'
import { isAssetEqual } from './isAssetEqual'

vi.mock('@paraspell/sdk-common', () => ({
  deepEqual: vi.fn()
}))

vi.mock('../guards', () => ({
  isForeignAsset: vi.fn()
}))

describe('isAssetEqual', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true if both assets have multiLocation and deepEqual returns true', () => {
    const asset1 = { symbol: 'ABC', multiLocation: {} } as TAsset
    const asset2 = { symbol: 'xyz', multiLocation: {} } as TAsset
    vi.mocked(deepEqual).mockReturnValue(true)
    const result = isAssetEqual(asset1, asset2)
    expect(result).toBe(true)
    expect(deepEqual).toHaveBeenCalledWith(asset1.multiLocation, asset2.multiLocation)
  })

  it('skips multiLocation check if one asset lacks multiLocation and falls back to symbol check', () => {
    const asset1 = { symbol: 'ABC', multiLocation: {} } as TAsset
    const asset2 = { symbol: 'aBc' } as TAsset
    vi.mocked(isForeignAsset).mockReturnValue(false)
    const result = isAssetEqual(asset1, asset2)
    expect(result).toBe(true)
  })

  it('returns true if both assets are foreign assets with matching assetId', () => {
    const asset1 = { symbol: 'ABC', assetId: '001' } as TAsset
    const asset2 = { symbol: 'DEF', assetId: '001' } as TAsset
    vi.mocked(isForeignAsset).mockReturnValue(true)
    const result = isAssetEqual(asset1, asset2)
    expect(result).toBe(true)
  })

  it('returns true if symbols match case-insensitively when no multiLocation or foreign asset conditions apply', () => {
    const asset1 = { symbol: 'Abc' } as TAsset
    const asset2 = { symbol: 'abc' } as TAsset
    vi.mocked(isForeignAsset).mockReturnValue(false)
    const result = isAssetEqual(asset1, asset2)
    expect(result).toBe(true)
  })

  it('returns false if symbols do not match and no conditions are met', () => {
    const asset1 = { symbol: 'Abc' } as TAsset
    const asset2 = { symbol: 'def' } as TAsset
    vi.mocked(isForeignAsset).mockReturnValue(false)
    const result = isAssetEqual(asset1, asset2)
    expect(result).toBe(false)
  })

  it('if foreign assets but assetIds differ, falls back to symbol check and returns true when symbols match', () => {
    const asset1 = { symbol: 'ABC', assetId: '001' } as TAsset
    const asset2 = { symbol: 'abc', assetId: '002' } as TAsset
    vi.mocked(isForeignAsset).mockReturnValue(true)
    const result = isAssetEqual(asset1, asset2)
    expect(result).toBe(true)
  })

  it('if foreign assets but assetIds differ and symbols do not match, returns false', () => {
    const asset1 = { symbol: 'ABC', assetId: '001' } as TAsset
    const asset2 = { symbol: 'XYZ', assetId: '002' } as TAsset
    vi.mocked(isForeignAsset).mockReturnValue(true)
    const result = isAssetEqual(asset1, asset2)
    expect(result).toBe(false)
  })
})
