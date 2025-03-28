import { describe, expect, it } from 'vitest'

import type { TAsset } from '../types'
import { isForeignAsset } from './isForeignAsset'

describe('isForeignAsset', () => {
  it('returns true for an asset with "assetId" and no "isNative"', () => {
    const asset = { assetId: 'abc' } as TAsset
    expect(isForeignAsset(asset)).toBe(true)
  })

  it('returns true for an asset with "multiLocation" and no "isNative"', () => {
    const asset = { multiLocation: {} } as TAsset
    expect(isForeignAsset(asset)).toBe(true)
  })

  it('returns false for an asset with "isNative" true', () => {
    const asset = { isNative: true } as TAsset
    expect(isForeignAsset(asset)).toBe(false)
  })

  it('returns false for an asset with "assetId" and "isNative" true', () => {
    const asset = { symbol: 'DOT', assetId: '123', isNative: true } as TAsset
    expect(isForeignAsset(asset)).toBe(false)
  })
})
