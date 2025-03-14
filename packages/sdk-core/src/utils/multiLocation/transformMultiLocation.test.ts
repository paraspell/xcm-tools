import { Parents, type TMultiLocation } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { transformMultiLocation } from './transformMultiLocation'

describe('transformMultiLocation', () => {
  it('should return interior as "Here" if input interior is "Here"', () => {
    const input = { parents: 5, interior: 'Here' } as const
    const result = transformMultiLocation(input)
    expect(result.interior).toBe('Here')
    expect(result.parents).toBe(Parents.ZERO)
  })

  it('should filter out the "Parachain" junction and update the interior key accordingly', () => {
    const input: TMultiLocation = {
      parents: 0,
      interior: {
        X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 50000028 }]
      }
    }
    const result = transformMultiLocation(input)
    expect(result.parents).toBe(Parents.ZERO)
    expect(result.interior).toEqual({
      X2: [{ PalletInstance: 50 }, { GeneralIndex: 50000028 }]
    })
  })

  it('should return interior as "Here" if all junctions are filtered out', () => {
    const input: TMultiLocation = {
      parents: 2,
      interior: {
        X1: [{ Parachain: 123 }]
      }
    }
    const result = transformMultiLocation(input)
    expect(result.parents).toBe(Parents.ZERO)
    expect(result.interior).toBe('Here')
  })
})
