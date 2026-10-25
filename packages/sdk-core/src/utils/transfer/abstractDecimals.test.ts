import { describe, expect, it } from 'vitest'

import { NumberFormatError } from '../../errors'
import { applyDecimalAbstraction } from './abstractDecimals'

describe('applyDecimalAbstraction', () => {
  it('returns bigint as-is when amount is bigint', () => {
    expect(applyDecimalAbstraction(100n, undefined, true)).toBe(100n)
    expect(applyDecimalAbstraction(100n, 10, true)).toBe(100n)
  })

  it('parses units correctly when decimals are provided', () => {
    expect(applyDecimalAbstraction('1.5', 6, true)).toBe(1500000n)
    expect(applyDecimalAbstraction('10', 10, true)).toBe(100000000000n)
  })

  it('returns integer BigInt when decimals is undefined and amount is integer', () => {
    expect(applyDecimalAbstraction('10', undefined, true)).toBe(10n)
    expect(applyDecimalAbstraction(10, undefined, true)).toBe(10n)
  })

  it('throws NumberFormatError when decimals is undefined and amount has fractional part', () => {
    expect(() => applyDecimalAbstraction('1.5', undefined, true)).toThrowError(NumberFormatError)
    expect(() => applyDecimalAbstraction('0.5', undefined, true)).toThrowError(NumberFormatError)
    expect(() => applyDecimalAbstraction('3.7', undefined, true)).toThrowError(NumberFormatError)
  })

  it('throws NumberFormatError when shouldAbstract is false and amount has decimals', () => {
    expect(() => applyDecimalAbstraction('1.5', 6, false)).toThrowError(NumberFormatError)
  })
})
