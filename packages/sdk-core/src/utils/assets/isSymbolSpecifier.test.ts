import { describe, expect, it } from 'vitest'

import type { TCurrencySymbolValue, TSymbolSpecifier } from '../../types'
import { isSymbolSpecifier } from './isSymbolSpecifier'

describe('isSymbolSpecifier', () => {
  it('should return true for a valid TSymbolSpecifier object', () => {
    const validSymbolSpecifier: TSymbolSpecifier = {
      type: 'Native',
      value: 'TEST'
    }

    expect(isSymbolSpecifier(validSymbolSpecifier)).toBe(true)
  })

  it('should return false for an object missing type property', () => {
    const invalidSymbolSpecifier = {
      value: 'TEST'
    }

    expect(isSymbolSpecifier(invalidSymbolSpecifier as TCurrencySymbolValue)).toBe(false)
  })

  it('should return false for an object missing value property', () => {
    const invalidSymbolSpecifier = {
      type: 'Native'
    }

    expect(isSymbolSpecifier(invalidSymbolSpecifier as TCurrencySymbolValue)).toBe(false)
  })

  it('should return false for a non-object input (e.g., string)', () => {
    const nonObjectInput = 'TEST'

    expect(isSymbolSpecifier(nonObjectInput as TCurrencySymbolValue)).toBe(false)
  })

  it('should return false for a non-object input (e.g., number)', () => {
    const nonObjectInput = 123

    expect(isSymbolSpecifier(nonObjectInput as unknown as TCurrencySymbolValue)).toBe(false)
  })
})
