import { type TLocation, Version } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { normalizeLocation } from './normalizeLocation'

describe('normalizeLocation', () => {
  it('returns the original object when interior is "Here"', () => {
    const ml: TLocation = { parents: 1, interior: 'Here' }

    const result = normalizeLocation(ml)

    expect(result).toBe(ml)
  })

  it('returns the original object when interior.X1 is undefined', () => {
    const ml: TLocation = { parents: 0, interior: {} }

    const result = normalizeLocation(ml)

    expect(result).toBe(ml)
  })

  it('returns the original object when interior.X1 is already an array (default V4)', () => {
    const ml: TLocation = {
      parents: 0,
      interior: { X1: [{ Parachain: 1000 }] }
    }

    const result = normalizeLocation(ml)

    expect(result).toBe(ml)
  })

  it('wraps interior.X1 in an array when it is a single object (default V4)', () => {
    const ml: TLocation = {
      parents: 2,
      interior: { X1: { Parachain: 2000 } }
    }

    const result = normalizeLocation(ml)

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

  it('returns the original object when version is "V3" and interior.X1 is already a single object', () => {
    const ml: TLocation = {
      parents: 3,
      interior: { X1: { Parachain: 3000 } }
    }

    const result = normalizeLocation(ml, Version.V3)

    expect(result).toBe(ml)
  })

  it('unwraps interior.X1 array to a single object when version is "V3"', () => {
    const ml: TLocation = {
      parents: 4,
      interior: { X1: [{ Parachain: 4000 }, { Parachain: 4001 }] }
    }

    const result = normalizeLocation(ml, Version.V3)

    expect(result).not.toBe(ml)
    expect(result).toEqual({
      parents: 4,
      interior: { X1: { Parachain: 4000 } }
    })
    expect(ml).toEqual({
      parents: 4,
      interior: { X1: [{ Parachain: 4000 }, { Parachain: 4001 }] }
    })
  })

  it('returns the original object when version is "V4" and interior.X1 is already an array', () => {
    const ml: TLocation = {
      parents: 5,
      interior: { X1: [{ Parachain: 5000 }] }
    }

    const result = normalizeLocation(ml, Version.V4)

    expect(result).toBe(ml)
  })

  it('wraps interior.X1 in an array when version is "V4" and X1 is a single object', () => {
    const ml: TLocation = {
      parents: 6,
      interior: { X1: { Parachain: 6000 } }
    }

    const result = normalizeLocation(ml, Version.V4)

    expect(result).not.toBe(ml)
    expect(result).toEqual({
      parents: 6,
      interior: { X1: [{ Parachain: 6000 }] }
    })
    expect(ml).toEqual({
      parents: 6,
      interior: { X1: { Parachain: 6000 } }
    })
  })
})
