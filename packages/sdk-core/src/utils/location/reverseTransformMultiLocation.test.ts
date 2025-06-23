import { Parents, type TMultiLocation } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { reverseTransformMultiLocation } from './reverseTransformMultiLocation'

const clone = <T>(v: T): T => structuredClone(v)

describe('reverseTransformMultiLocation', () => {
  it('adds {Parachain:1000} to an empty interior ("Here")', () => {
    const input: TMultiLocation = { parents: Parents.ZERO, interior: 'Here' }
    const result = reverseTransformMultiLocation(clone(input))

    expect(result).toEqual({
      parents: Parents.ONE,
      interior: { X1: [{ Parachain: 1000 }] }
    })

    expect(input).toEqual({ parents: Parents.ZERO, interior: 'Here' })
  })

  it('prepends {Parachain:1000} when not already present', () => {
    const input: TMultiLocation = {
      parents: Parents.TWO,
      interior: {
        X2: [
          { AccountId32: { id: '0x01', network: null } },
          { AccountKey20: { key: '0x02', network: null } }
        ]
      }
    }

    const result = reverseTransformMultiLocation(clone(input))

    expect(result.parents).toBe(Parents.ONE)
    expect(result.interior).toEqual({
      X3: [
        { Parachain: 1000 },
        { AccountId32: { id: '0x01', network: null } },
        { AccountKey20: { key: '0x02', network: null } }
      ]
    })
  })

  it('keeps interior unchanged when Parachain 1000 already exists (only parents set to ONE)', () => {
    const input: TMultiLocation = {
      parents: Parents.TWO,
      interior: {
        X2: [{ Parachain: 1000 }, { AccountId32: { id: '0xdead', network: null } }]
      }
    }

    const result = reverseTransformMultiLocation(clone(input))

    expect(result.interior).toEqual(input.interior)
    expect(result.parents).toBe(Parents.ONE)
  })
})
