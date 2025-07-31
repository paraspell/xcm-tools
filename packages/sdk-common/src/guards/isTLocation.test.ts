import { describe, expect, it } from 'vitest'

import { isTLocation } from '.'

describe('isTLocation', () => {
  it('returns true for a valid TLocation object', () => {
    const validObject = {
      parents: 2,
      interior: 'Here'
    }

    expect(isTLocation(validObject)).toBe(true)
  })

  it('returns false if "parents" property is missing', () => {
    const invalidObject = {
      interior: 'No parents here'
    }

    expect(isTLocation(invalidObject)).toBe(false)
  })

  it('returns false if "interior" property is missing', () => {
    const invalidObject = {
      parents: 1
    }

    expect(isTLocation(invalidObject)).toBe(false)
  })

  it('returns false if value is null', () => {
    expect(isTLocation(null)).toBe(false)
  })

  it('returns false if value is not an object', () => {
    expect(isTLocation('string')).toBe(false)
    expect(isTLocation(123)).toBe(false)
    expect(isTLocation([])).toBe(false)
  })

  it('returns false if "parents" and "interior" exist but value is not an object (edge case)', () => {
    const notAnObject = 'parents' in String.prototype ? String.prototype : 'Test string'

    expect(isTLocation(notAnObject)).toBe(false)
  })
})
