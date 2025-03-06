import { describe, expect, it } from 'vitest'

import type { TMultiLocation, TOverrideMultiLocationSpecifier } from '../../types'
import { Override } from './multiLocationSelectors'

describe('Override Function', () => {
  it('should return an object with type "Override" and the correct value', () => {
    const sampleMultiLocation: TMultiLocation = {
      parents: 1,
      interior: {
        X1: { Parachain: 1000 }
      }
    }

    const result = Override(sampleMultiLocation)

    const expected: TOverrideMultiLocationSpecifier = {
      type: 'Override',
      value: sampleMultiLocation
    }
    expect(result).toEqual(expected)
  })
})
