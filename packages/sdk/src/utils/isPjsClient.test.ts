import { describe, it, expect } from 'vitest'
import { isPjsClient } from './isPjsClient'

describe('isPjsClient', () => {
  it('should return true for an object with a disconnect function', () => {
    const mockApi = {
      disconnect: async () => {}
    }
    expect(isPjsClient(mockApi)).toBe(true)
  })

  it('should return false for an object without a disconnect property', () => {
    const mockApi = {
      someOtherProperty: 'value'
    }
    expect(isPjsClient(mockApi)).toBe(false)
  })

  it('should return false for an object where disconnect is not a function', () => {
    const mockApi = {
      disconnect: 'not a function'
    }
    expect(isPjsClient(mockApi)).toBe(false)
  })

  it('should return false for null', () => {
    expect(isPjsClient(null)).toBe(false)
  })

  it('should return false for a non-object type (e.g., number)', () => {
    expect(isPjsClient(42)).toBe(false)
  })

  it('should return false for an object where disconnect is missing', () => {
    const mockApi = {}
    expect(isPjsClient(mockApi)).toBe(false)
  })
})
