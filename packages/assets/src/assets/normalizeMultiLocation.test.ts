import type { TMultiLocation } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { normalizeMultiLocation } from './normalizeMultiLocation'

describe('normalizeMultiLocation', () => {
  it('returns the original object when interior is "Here"', () => {
    const ml: TMultiLocation = { parents: 1, interior: 'Here' } as TMultiLocation

    const result = normalizeMultiLocation(ml)

    expect(result).toBe(ml)
  })

  it('returns the original object when interior.X1 is undefined', () => {
    const ml: TMultiLocation = { parents: 0, interior: {} } as TMultiLocation

    const result = normalizeMultiLocation(ml)

    expect(result).toBe(ml)
  })

  it('returns the original object when interior.X1 is already an array', () => {
    const ml: TMultiLocation = {
      parents: 0,
      interior: { X1: [{ Parachain: 1000 }] }
    } as TMultiLocation

    const result = normalizeMultiLocation(ml)

    expect(result).toBe(ml)
  })

  it('wraps interior.X1 in an array when it is a single object', () => {
    const ml: TMultiLocation = {
      parents: 2,
      interior: { X1: { Parachain: 2000 } }
    } as TMultiLocation

    const result = normalizeMultiLocation(ml)

    expect(result).not.toBe(ml)

    expect(result).toEqual({
      parents: 2,
      interior: { X1: [{ Parachain: 2000 }] }
    })
    expect(ml).toEqual({
      parents: 2,
      interior: { X1: { Parachain: 2000 } }
    })
  })
})
