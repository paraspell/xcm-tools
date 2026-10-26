import { describe, expect, it } from 'vitest'

import { NumberFormatError } from '../../errors'
import { applyDecimalAbstraction } from './abstractDecimals'

describe('applyDecimalAbstraction', () => {
  it('returns bigint amounts unchanged', () => {
    expect(applyDecimalAbstraction(100n, undefined, true)).toBe(100n)
    expect(applyDecimalAbstraction(100n, 0, true)).toBe(100n)
    expect(applyDecimalAbstraction(100n, 6, false)).toBe(100n)
  })

  describe('when decimals are not abstracted', () => {
    it('parses integer amounts', () => {
      expect(applyDecimalAbstraction('10', 6, false)).toBe(10n)
      expect(applyDecimalAbstraction(10, undefined, false)).toBe(10n)
    })

    it('throws NumberFormatError for fractional amounts', () => {
      expect(() => applyDecimalAbstraction('1.5', 6, false)).toThrow(NumberFormatError)
      expect(() => applyDecimalAbstraction('1.0', 0, false)).toThrow(NumberFormatError)
    })
  })

  describe('when the asset has no decimals', () => {
    it('parses integer amounts', () => {
      expect(applyDecimalAbstraction('10', undefined, true)).toBe(10n)
      expect(applyDecimalAbstraction(10, undefined, true)).toBe(10n)
    })
  })

  describe('when decimals are defined', () => {
    it.each<[string | number, number, bigint]>([
      ['1.5', 6, 1_500_000n],
      [1.5, 6, 1_500_000n],
      ['3', 0, 3n],
      [3, 0, 3n],
      ['1.0', 0, 1n],
      ['1.00', 0, 1n],
      ['10.000', 0, 10n],
      ['0.0', 0, 0n],
      ['1.50', 1, 15n],
      ['1.500', 1, 15n],
      ['1.100', 2, 110n],
      ['0.50', 2, 50n],
      ['0.005', 3, 5n],
      ['0.0050', 3, 5n],
      ['1.999999', 6, 1_999_999n],
      ['10', 10, 100_000_000_000n],
      ['.5', 1, 5n],
      ['-1.50', 1, -15n],
      ['-1.0', 0, -1n]
    ])('parses %s with %i decimals as %s', (amount, decimals, expected) => {
      expect(applyDecimalAbstraction(amount, decimals, true)).toBe(expected)
    })

    it.each<[string | number, number]>([
      ['1.5', 0],
      [1.5, 0],
      ['0.4', 0],
      [0.4, 0],
      ['2.5', 0],
      ['2.4', 0],
      ['0.400', 0],
      ['0.005', 2],
      [0.005, 2],
      ['1.005', 2],
      ['1.9999999', 6],
      [1.9999999, 6],
      ['1.51', 1],
      ['1.5001', 1],
      ['.5', 0],
      ['-1.5', 0],
      ['-0.005', 2]
    ])(
      'throws NumberFormatError when %s has more fractional digits than %i decimals',
      (amount, decimals) => {
        expect(() => applyDecimalAbstraction(amount, decimals, true)).toThrow(NumberFormatError)
      }
    )

    it('names the amount and the asset decimals in the error', () => {
      expect(() => applyDecimalAbstraction('0.005', 2, true)).toThrow(
        'Amount 0.005 has more fractional digits than the asset decimals (2)'
      )
    })

    it('does not silently round exponent notation', () => {
      expect(() => applyDecimalAbstraction(1e-7, 6, true)).toThrow()
      expect(() => applyDecimalAbstraction('1.5e2', 6, true)).toThrow()
    })
  })
})
