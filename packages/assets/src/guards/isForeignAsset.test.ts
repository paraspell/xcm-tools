import { describe, expect, it } from 'vitest'

import type { TAssetInfo } from '../types'
import { isForeignAsset } from './isForeignAsset'

describe('isForeignAsset', () => {
  it('returns true for an asset with "assetId" and no "isNative"', () => {
    const asset = { assetId: 'abc' } as TAssetInfo
    expect(isForeignAsset(asset)).toBe(true)
  })

  it('returns true for an asset with "location" and no "isNative"', () => {
    const asset = { location: {} } as TAssetInfo
    expect(isForeignAsset(asset)).toBe(true)
  })

  it('returns false for an asset with "isNative" true', () => {
    const asset = { isNative: true } as TAssetInfo
    expect(isForeignAsset(asset)).toBe(false)
  })

  it('returns false for an asset with "assetId" and "isNative" true', () => {
    const asset = { symbol: 'DOT', assetId: '123', decimals: 18, isNative: true } as TAssetInfo
    expect(isForeignAsset(asset)).toBe(false)
  })
})
