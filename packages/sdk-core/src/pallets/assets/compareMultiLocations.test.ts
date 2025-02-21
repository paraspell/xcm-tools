import { describe, it, expect } from 'vitest'
import { compareMultiLocations } from './compareMultiLocations'
import type { TForeignAsset } from '../../types'

describe('compareMultiLocations', () => {
  it('should return true when input matches sanitized asset.multiLocation (comma removed)', () => {
    const asset = { multiLocation: '1,2' } as unknown as TForeignAsset
    const input = '"12"'
    expect(compareMultiLocations(input, asset)).toBe(true)
  })

  it('should return true when input matches unsanitized asset.multiLocation', () => {
    const asset = { multiLocation: '1,2' } as unknown as TForeignAsset
    const input = '"1,2"'
    expect(compareMultiLocations(input, asset)).toBe(true)
  })

  it('should return false when input is not JSON.stringified even if content appears similar', () => {
    const asset = { multiLocation: '1,2' } as unknown as TForeignAsset
    const input = '1,2'
    expect(compareMultiLocations(input, asset)).toBe(false)
  })

  it('should return false when comparing simple strings that are not in JSON format', () => {
    const asset = { multiLocation: 'abc' } as unknown as TForeignAsset
    const input = 'abc'
    expect(compareMultiLocations(input, asset)).toBe(false)
  })

  it('should return true when input matches a simple string asset value in JSON format', () => {
    const asset = { multiLocation: 'abc' } as unknown as TForeignAsset
    const input = '"abc"'
    expect(compareMultiLocations(input, asset)).toBe(true)
  })
})
