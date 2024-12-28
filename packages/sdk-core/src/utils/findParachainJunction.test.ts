import { describe, it, expect } from 'vitest'
import type { TMultiLocation } from '../types'
import { Parents } from '../types'
import { findParachainJunction } from './findParachainJunction'

describe('findParachainJunction', () => {
  it('should return null when interior is "Here"', () => {
    const multilocation: TMultiLocation = { interior: 'Here', parents: Parents.ONE }
    expect(findParachainJunction(multilocation)).toBeNull()
  })

  it('should return the parachain number when it exists in a junction array', () => {
    const multilocation: TMultiLocation = {
      parents: Parents.TWO,
      interior: {
        X2: [{ Parachain: 2000 }, { PalletInstance: 123 }]
      }
    }
    expect(findParachainJunction(multilocation)).toBe(2000)
  })

  it('should return the parachain number when it exists as a single object', () => {
    const multilocation: TMultiLocation = {
      parents: Parents.TWO,
      interior: {
        X1: { Parachain: 3000 }
      }
    }
    expect(findParachainJunction(multilocation)).toBe(3000)
  })

  it('should return null when no Parachain is found in the junctions', () => {
    const multilocation: TMultiLocation = {
      parents: Parents.TWO,
      interior: {
        X2: [{ PalletInstance: 200 }, { PalletInstance: 456 }]
      }
    }
    expect(findParachainJunction(multilocation)).toBeNull()
  })

  it('should return null when the junction object does not contain a Parachain key', () => {
    const multilocation: TMultiLocation = {
      parents: Parents.TWO,
      interior: {
        X1: { PalletInstance: 789 }
      }
    }
    expect(findParachainJunction(multilocation)).toBeNull()
  })

  it('should handle complex objects with multiple junction arrays correctly', () => {
    const multilocation: TMultiLocation = {
      parents: Parents.TWO,
      interior: {
        X2: [{ GeneralIndex: 100 }, { Parachain: 4000 }]
      }
    }
    expect(findParachainJunction(multilocation)).toBe(4000)
  })
})
