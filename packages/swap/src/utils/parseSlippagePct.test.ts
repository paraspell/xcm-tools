import { ValidationError } from '@paraspell/sdk-core'
import { describe, expect, it } from 'vitest'

import { parseSlippagePct } from './parseSlippagePct'

describe('parseSlippagePct', () => {
  it('returns the numeric percentage for a valid value', () => {
    expect(parseSlippagePct('0')).toBe(0)
    expect(parseSlippagePct('1.5')).toBe(1.5)
    expect(parseSlippagePct('12')).toBe(12)
  })

  it('throws a ValidationError that names slippage when the value is missing', () => {
    expect(() => parseSlippagePct(undefined as unknown as string)).toThrow(ValidationError)
    expect(() => parseSlippagePct(undefined as unknown as string)).toThrow(/slippagePct/)
    expect(() => parseSlippagePct('')).toThrow(/slippagePct/)
  })

  it('rejects values that are not finite numbers', () => {
    expect(() => parseSlippagePct('abc')).toThrow(/finite number/)
    expect(() => parseSlippagePct('NaN')).toThrow(/finite number/)
    expect(() => parseSlippagePct('Infinity')).toThrow(/finite number/)
  })

  it('rejects values outside 0 <= pct < 100', () => {
    expect(() => parseSlippagePct('-1')).toThrow(/less than 100/)
    expect(() => parseSlippagePct('100')).toThrow(/less than 100/)
    expect(() => parseSlippagePct('101')).toThrow(/less than 100/)
  })
})
