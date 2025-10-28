import { describe, expect, it } from 'vitest'

import { MIN_AMOUNT } from '../constants'
import { normalizeAmount } from './normalizeAmount'

describe('normalizeAmount', () => {
  it('returns MIN_AMOUNT when amount is below minimum', () => {
    const result = normalizeAmount(MIN_AMOUNT - 1n)
    expect(result).toBe(MIN_AMOUNT)
  })

  it('returns the same amount when amount equals MIN_AMOUNT', () => {
    const result = normalizeAmount(MIN_AMOUNT)
    expect(result).toBe(MIN_AMOUNT)
  })

  it('returns the amount when it exceeds MIN_AMOUNT', () => {
    const aboveMin = MIN_AMOUNT + 10n
    const result = normalizeAmount(aboveMin)
    expect(result).toBe(aboveMin)
  })
})
