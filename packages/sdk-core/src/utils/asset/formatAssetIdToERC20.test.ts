import { describe, expect, it } from 'vitest'

import { formatAssetIdToERC20 } from './formatAssetIdToERC20'

describe('formatAssetIdToERC20', () => {
  it('should return the same string if it starts with "0x"', () => {
    const hexId = '0x1234567890abcdef'
    const result = formatAssetIdToERC20(hexId)
    expect(result).toBe(hexId)
  })

  it('should throw an error if the string is shorter than 38 digits', () => {
    const invalidId = '1234567890123456789012345678901234567' // 37 digits
    expect(() => formatAssetIdToERC20(invalidId)).toThrowError()
  })

  it('should throw an error if the string is longer than 39 digits', () => {
    const invalidId = '1234567890123456789012345678901234567890' // 40 digits
    expect(() => formatAssetIdToERC20(invalidId)).toThrowError()
  })

  it('should correctly format a 38-digit numeric string to a hex string', () => {
    const validId = '12345678901234567890123456789012345678'
    const result = formatAssetIdToERC20(validId)

    expect(result.startsWith('0xffffffff')).toBeTruthy()
    expect(result.length).toBe(42)
  })

  it('should correctly format a 39-digit numeric string to a hex string', () => {
    const validId39 = '123456789012345678901234567890123456789'
    const result39 = formatAssetIdToERC20(validId39)

    expect(result39.startsWith('0xffffffff')).toBeTruthy()
    expect(result39.length).toBe(42)
  })
})
