import { describe, expect, it } from 'vitest'

import { applyDecimalAbstraction } from './abstractDecimals'

describe('applyDecimalAbstraction without decimals (issue #2235)', () => {
  it('throws instead of truncating a fractional amount', () => {
    expect(() => applyDecimalAbstraction('1.5', undefined, true)).toThrow(/no decimals/)
  })

  it('still accepts integer amounts', () => {
    expect(applyDecimalAbstraction('1000', undefined, true)).toBe(1000n)
  })

  it('still converts through parseUnits when decimals are known', () => {
    expect(applyDecimalAbstraction('1.5', 10, true)).toBe(15_000_000_000n)
  })
})
