import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isSymbolMatch } from './isSymbolMatch'
import { normalizeSymbol } from './normalizeSymbol'

vi.mock('./normalizeSymbol', () => ({
  normalizeSymbol: vi.fn()
}))

describe('isSymbolMatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(normalizeSymbol).mockImplementation(symbol => (symbol ? symbol.toUpperCase() : ''))
  })

  it('returns true when normalized symbols are equal', () => {
    const result = isSymbolMatch('dot', 'DOT')

    expect(normalizeSymbol).toHaveBeenCalledWith('dot')
    expect(normalizeSymbol).toHaveBeenCalledWith('DOT')
    expect(normalizeSymbol).toHaveBeenCalledTimes(2)
    expect(result).toBe(true)
  })

  it('returns false when normalized symbols are different', () => {
    const result = isSymbolMatch('DOT', 'ACA')

    expect(normalizeSymbol).toHaveBeenCalledWith('DOT')
    expect(normalizeSymbol).toHaveBeenCalledWith('ACA')
    expect(normalizeSymbol).toHaveBeenCalledTimes(2)
    expect(result).toBe(false)
  })

  it('returns true when both symbols are identical', () => {
    const result = isSymbolMatch('DOT', 'DOT')

    expect(normalizeSymbol).toHaveBeenCalledWith('DOT')
    expect(normalizeSymbol).toHaveBeenCalledTimes(2)
    expect(result).toBe(true)
  })

  it('handles empty strings', () => {
    const result = isSymbolMatch('', '')

    expect(normalizeSymbol).toHaveBeenCalledWith('')
    expect(normalizeSymbol).toHaveBeenCalledTimes(2)
    expect(result).toBe(true)
  })

  it('handles case where normalizeSymbol returns different values', () => {
    vi.mocked(normalizeSymbol)
      .mockReturnValueOnce('NORMALIZED_A')
      .mockReturnValueOnce('NORMALIZED_B')

    const result = isSymbolMatch('symbolA', 'symbolB')

    expect(normalizeSymbol).toHaveBeenCalledWith('symbolA')
    expect(normalizeSymbol).toHaveBeenCalledWith('symbolB')
    expect(result).toBe(false)
  })

  it('handles case where normalizeSymbol returns same values', () => {
    vi.mocked(normalizeSymbol).mockReturnValueOnce('SAME_VALUE').mockReturnValueOnce('SAME_VALUE')

    const result = isSymbolMatch('different', 'inputs')

    expect(normalizeSymbol).toHaveBeenCalledWith('different')
    expect(normalizeSymbol).toHaveBeenCalledWith('inputs')
    expect(result).toBe(true)
  })
})
