// Regression test for C-1: transform() must convert a string numeric
// currency_id to a number in multi-key objects (missing `continue` let the
// generic string branch overwrite it with { type: '100' }).
import { describe, expect, it } from 'vitest'

import { transform } from './PapiXcmTransformer'

describe('C-1 regression: multi-key string currency_id', () => {
  it('converts string currency_id to a number like its sibling keys', () => {
    const out = transform({
      fee_item: '5',
      currency_id: '100',
      amount: '5000000000',
    }) as Record<string, unknown>
    // Control: sibling keys convert correctly through the real code
    expect(out.fee_item).toBe(5)
    expect(out.amount).toBe(5000000000n)
    // The bug: missing `continue` lets the generic string branch overwrite 100
    expect(out.currency_id).toBe(100)
  })
})
