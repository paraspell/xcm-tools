import { describe, expect, it } from 'vitest'

import { isTMultiLocation } from '.'

describe('isTMultiLocation', () => {
  it('returns true for a valid TMultiLocation object', () => {
    const validObject = {
      parents: 2,
      interior: 'Here'
    }

    expect(isTMultiLocation(validObject)).toBe(true)
  })

  it('returns false if "parents" property is missing', () => {
    const invalidObject = {
      interior: 'No parents here'
    }

    expect(isTMultiLocation(invalidObject)).toBe(false)
  })

  it('returns false if "interior" property is missing', () => {
    const invalidObject = {
      parents: 1
    }

    expect(isTMultiLocation(invalidObject)).toBe(false)
  })

  it('returns false if value is null', () => {
    expect(isTMultiLocation(null)).toBe(false)
  })

  it('returns false if value is not an object', () => {
    expect(isTMultiLocation('string')).toBe(false)
    expect(isTMultiLocation(123)).toBe(false)
    expect(isTMultiLocation([])).toBe(false)
  })

  it('returns false if "parents" and "interior" exist but value is not an object (edge case)', () => {
    const notAnObject = 'parents' in String.prototype ? String.prototype : 'Test string'

    expect(isTMultiLocation(notAnObject)).toBe(false)
  })
})
