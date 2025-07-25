import { describe, expect, it } from 'vitest'

import { isConfig } from './isConfig'

describe('isConfig', () => {
  it('should return true for object with apiOverrides', () => {
    const input = { apiOverrides: {} }
    expect(isConfig(input)).toBe(true)
  })

  it('should return true for object with development', () => {
    const input = { development: true }
    expect(isConfig(input)).toBe(true)
  })

  it('should return false for null', () => {
    expect(isConfig(null)).toBe(false)
  })

  it('should return false for non-object types', () => {
    expect(isConfig('string')).toBe(false)
    expect(isConfig(123)).toBe(false)
    expect(isConfig(true)).toBe(false)
  })

  it('should return false for arrays', () => {
    expect(isConfig([])).toBe(false)
  })

  it('should return false for objects without expected keys', () => {
    expect(isConfig({ someOtherKey: 'value' })).toBe(false)
  })

  it('should return true for empty object', () => {
    expect(isConfig({})).toBe(true)
  })
})
