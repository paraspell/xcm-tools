import type { TAmount } from '@paraspell/assets'
import { describe, expect, it } from 'vitest'

import { NumberFormatError } from '../../errors'
import { applyDecimalAbstraction } from './abstractDecimals'

describe('applyDecimalAbstraction', () => {
  describe('abstractDecimals: true', () => {
    it.each<[TAmount, bigint]>([
      ['1.5', 15_000_000_000n],
      [1.5, 15_000_000_000n],
      ['0.1', 1_000_000_000n],
      [0.1, 1_000_000_000n],
      ['0.0000005', 5000n],
      [0.0000005, 5000n],
      [1.5e-7, 1500n],
      [-5e-7, -5000n],
      ['1000000000000000000000', 10n ** 31n],
      [1e21, 10n ** 31n]
    ])('parses %s as human units', (amount, expected) => {
      expect(applyDecimalAbstraction(amount, 10, true)).toBe(expected)
    })

    it('leaves bigint amounts as raw units', () => {
      expect(applyDecimalAbstraction(15n, 10, true)).toBe(15n)
    })

    it.each<[TAmount, bigint]>([
      ['15', 15n],
      ['12.7', 12n],
      [12.7, 12n],
      [5e-7, 0n],
      [1e21, 10n ** 21n]
    ])('returns the integer part of %s when decimals are unknown', (amount, expected) => {
      expect(applyDecimalAbstraction(amount, undefined, true)).toBe(expected)
    })
  })

  describe('abstractDecimals: false', () => {
    it.each<[TAmount, bigint]>([
      ['15', 15n],
      [15, 15n],
      [15n, 15n],
      ['1000000000000000000000', 10n ** 21n],
      [1e21, 10n ** 21n],
      [1.5e21, 15n * 10n ** 20n]
    ])('parses %s as raw units', (amount, expected) => {
      expect(applyDecimalAbstraction(amount, 10, false)).toBe(expected)
    })

    it.each<TAmount>(['1.5', 1.5, '0.0000005', 5e-7])(
      'throws NumberFormatError for fractional amount %s',
      amount => {
        expect(() => applyDecimalAbstraction(amount, 10, false)).toThrow(NumberFormatError)
      }
    )
  })
})
