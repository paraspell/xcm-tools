// Regression test for D-1: transform() must convert a string numeric
// currency_id to a number in multi-key objects (missing `continue` let the
// generic string branch overwrite it with { type: '123' }).
import { describe, expect, it } from 'vitest'

import { transform } from './XcmTransformer'

describe('D-1 regression: multi-key string currency_id', () => {
  it('converts string currency_id to a number like its sibling keys', () => {
    const out = transform({
      dest: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      currency_id: '123',
      amount: '100',
    }) as Record<string, unknown>
    // Control: amount converts correctly through the real code
    expect(out.amount).toBe(100n)
    // The bug: missing `continue` lets the generic string branch overwrite 123
    // (note: Dedot's transform camelCases keys, so currency_id -> currencyId)
    expect(out.currencyId).toBe(123)
  })
})
