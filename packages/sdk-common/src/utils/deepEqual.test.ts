import { describe, expect, it } from 'vitest'

import { deepEqual, isPrimitive } from '.'

describe('isPrimitive', () => {
  it('should return true for primitives', () => {
    expect(isPrimitive(1)).toBe(true)
    expect(isPrimitive('test')).toBe(true)
    expect(isPrimitive(true)).toBe(true)
    expect(isPrimitive(null)).toBe(true)
    expect(isPrimitive(undefined)).toBe(true)
    expect(isPrimitive(Symbol())).toBe(true)
  })

  it('should return false for non-primitives (objects, arrays, etc.)', () => {
    expect(isPrimitive({})).toBe(false)
    expect(isPrimitive([])).toBe(false)
    expect(isPrimitive(new Date())).toBe(false)
    expect(isPrimitive(() => {})).toBe(false)
  })
})

describe('deepEqual', () => {
  it('should return true for strictly equal primitives', () => {
    expect(deepEqual(1, 1)).toBe(true)
    expect(deepEqual('test', 'test')).toBe(true)
    expect(deepEqual(true, true)).toBe(true)
    expect(deepEqual(null, null)).toBe(true)
    expect(deepEqual(undefined, undefined)).toBe(true)
  })

  it('should return false for different primitives', () => {
    expect(deepEqual(1, 2)).toBe(false)
    expect(deepEqual('test', 'different')).toBe(false)
    expect(deepEqual(true, false)).toBe(false)
    expect(deepEqual(null, undefined)).toBe(false)
  })

  it('should return true for deeply equal objects', () => {
    const objA = { a: 1, b: { c: 2, d: 3 } }
    const objB = { a: 1, b: { c: 2, d: 3 } }
    expect(deepEqual(objA, objB)).toBe(true)
  })

  it('should return false for non-equal objects', () => {
    const objA = { a: 1, b: { c: 2, d: 3 } }
    const objB = { a: 1, b: { c: 2, d: 4 } }
    expect(deepEqual(objA, objB)).toBe(false)
  })

  it('should return false if one object has extra properties', () => {
    const objA = { a: 1, b: 2 }
    const objB = { a: 1 }
    expect(deepEqual(objA, objB)).toBe(false)
  })

  it('should return true for deeply equal arrays', () => {
    const arrA = [1, 2, { a: 3 }]
    const arrB = [1, 2, { a: 3 }]
    expect(deepEqual(arrA, arrB)).toBe(true)
  })

  it('should return false for non-equal arrays', () => {
    const arrA = [1, 2, { a: 3 }]
    const arrB = [1, 2, { a: 4 }]
    expect(deepEqual(arrA, arrB)).toBe(false)
  })

  it('should return false for comparing arrays to objects', () => {
    const arr = [1, 2, 3]
    const obj = { 0: 1, 1: 2, 2: 3 }
    expect(deepEqual(arr, obj)).toBe(false)
  })

  it('should return true for objects with nested arrays', () => {
    const objA = { a: 1, b: [2, { c: 3 }] }
    const objB = { a: 1, b: [2, { c: 3 }] }
    expect(deepEqual(objA, objB)).toBe(true)
  })

  it('should handle null and undefined properly', () => {
    expect(deepEqual(null, null)).toBe(true)
    expect(deepEqual(undefined, undefined)).toBe(true)
    expect(deepEqual(null, undefined)).toBe(false)
    expect(deepEqual({ a: null }, { a: undefined })).toBe(false)
  })

  it('should return true for empty objects and arrays', () => {
    expect(deepEqual({}, {})).toBe(true)
    expect(deepEqual([], [])).toBe(true)
  })

  it('should return false for empty object and empty array comparison', () => {
    expect(deepEqual({}, [])).toBe(false)
  })

  it('should return true for multilocation objects', () => {
    const objA = {
      parents: 1,
      interior: {
        X1: {
          Parachain: 2011
        }
      }
    }
    const objB = {
      parents: 1,
      interior: {
        X1: {
          Parachain: 2011
        }
      }
    }
    expect(deepEqual(objA, objB)).toBe(true)
  })

  it('should return false for different multilocation objects', () => {
    const objA = {
      parents: 1,
      interior: {
        X1: {
          Parachain: 2011
        }
      }
    }
    const objB = {
      parents: 1,
      interior: {
        X1: {
          Parachain: 2010
        }
      }
    }
    expect(deepEqual(objA, objB)).toBe(false)
  })

  it('should return false for different multilocation objects with different keys', () => {
    const objA = {
      parents: 1,
      interior: {
        X1: {
          Parachain: 2011
        }
      }
    }
    const objB = {
      parents: 1,
      interior: {
        X2: {
          Parachain: 2011
        }
      }
    }
    expect(deepEqual(objA, objB)).toBe(false)
  })

  it('should return false for different multilocation objects with different values', () => {
    const objA = {
      parents: 1,
      interior: {
        X1: {
          Parachain: 2011
        }
      }
    }
    const objB = {
      parents: 1,
      interior: {
        X1: {
          Parachain: 2010
        }
      }
    }
    expect(deepEqual(objA, objB)).toBe(false)
  })

  it('should return true for different multilocation objects with lowercase keys', () => {
    const objA = {
      parents: 1,
      interior: {
        x1: {
          parachain: 2011
        }
      }
    }
    const objB = {
      parents: 1,
      interior: {
        X1: {
          Parachain: 2011
        }
      }
    }
    expect(deepEqual(objA, objB)).toBe(true)
  })

  it('should return true for different multilocation objects with lowercase keys but one key different', () => {
    const objA = {
      parents: 1,
      interior: {
        x1: {
          parachain: 2011
        }
      }
    }
    const objB = {
      parents: 1,
      interior: {
        x2: {
          Parachaim: 2011
        }
      }
    }
    expect(deepEqual(objA, objB)).toBe(false)
  })
})
