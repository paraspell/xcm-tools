import { describe, it, expect } from 'vitest'
import { TScenario } from '../types'
import { getFees } from './getFees'

describe('getFees', () => {
  it('should return the correct fee for ParaToRelay scenario', () => {
    const result = getFees('ParaToRelay' as TScenario)
    expect(result).toBe(4600000000)
  })

  it('should return the correct fee for ParaToPara scenario', () => {
    const result = getFees('ParaToPara' as TScenario)
    expect(result).toBe(399600000000)
  })

  it('should throw an error for an undefined scenario', () => {
    expect(() => getFees('UnknownScenario' as TScenario)).toThrowError(
      'Fees for scenario UnknownScenario are not defined.'
    )
  })
})
