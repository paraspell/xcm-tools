import { describe, expect, it } from 'vitest'

import { normalizeSymbol } from './normalizeSymbol'

describe('normalizeSymbol', () => {
  it('returns an empty string for undefined input', () => {
    expect(normalizeSymbol(undefined)).toBe('')
  })

  it('returns an empty string for empty input', () => {
    expect(normalizeSymbol('')).toBe('')
  })

  it('removes "xc" prefix and lowercases the symbol', () => {
    expect(normalizeSymbol('xcDOT')).toBe('dot')
    expect(normalizeSymbol('XCKSM')).toBe('ksm')
    expect(normalizeSymbol('xceth')).toBe('eth')
  })

  it('lowercases the symbol if it does not start with "xc"', () => {
    expect(normalizeSymbol('BTC')).toBe('btc')
    expect(normalizeSymbol('ksm')).toBe('ksm')
  })

  it('does not remove "xc" if not at the beginning', () => {
    expect(normalizeSymbol('myxcDOT')).toBe('myxcdot')
  })
})
