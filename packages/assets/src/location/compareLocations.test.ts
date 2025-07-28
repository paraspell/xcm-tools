import { describe, expect, it } from 'vitest'

import type { TForeignAssetInfo } from '../types'
import { compareLocations } from './compareLocations'

describe('compareLocations', () => {
  it('should return true when input matches sanitized asset.location (comma removed)', () => {
    const asset = { location: '1,2' } as unknown as TForeignAssetInfo
    const input = '"12"'
    expect(compareLocations(input, asset)).toBe(true)
  })

  it('should return true when input matches unsanitized asset.location', () => {
    const asset = { location: '1,2' } as unknown as TForeignAssetInfo
    const input = '"1,2"'
    expect(compareLocations(input, asset)).toBe(true)
  })

  it('should return false when input is not JSON.stringified even if content appears similar', () => {
    const asset = { location: '1,2' } as unknown as TForeignAssetInfo
    const input = '1,2'
    expect(compareLocations(input, asset)).toBe(false)
  })

  it('should return false when comparing simple strings that are not in JSON format', () => {
    const asset = { location: 'abc' } as unknown as TForeignAssetInfo
    const input = 'abc'
    expect(compareLocations(input, asset)).toBe(false)
  })

  it('should return true when input matches a simple string asset value in JSON format', () => {
    const asset = { location: 'abc' } as unknown as TForeignAssetInfo
    const input = '"abc"'
    expect(compareLocations(input, asset)).toBe(true)
  })
})
