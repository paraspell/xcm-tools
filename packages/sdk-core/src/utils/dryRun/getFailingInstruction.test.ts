import { describe, expect, it } from 'vitest'

import { getFailingInstruction } from './getFailingInstruction'

describe('getFailingInstruction', () => {
  const WITHDRAW = { type: 'WithdrawAsset', value: [] }
  const BUY_EXEC = { type: 'BuyExecution', value: {} }

  it('returns undefined when failureIndex is undefined', () => {
    expect(getFailingInstruction({ type: 'V4', value: [WITHDRAW] }, undefined)).toBeUndefined()
  })

  it('returns undefined when message is null or not an object', () => {
    expect(getFailingInstruction(null, 0)).toBeUndefined()
    expect(getFailingInstruction(undefined, 0)).toBeUndefined()
    expect(getFailingInstruction(42, 0)).toBeUndefined()
  })

  it('indexes a raw instruction array', () => {
    expect(getFailingInstruction([WITHDRAW, BUY_EXEC], 1)).toEqual(BUY_EXEC)
  })

  it('unwraps a PAPI/dedot versioned wrapper ({ type, value: [...] })', () => {
    expect(getFailingInstruction({ type: 'V4', value: [WITHDRAW, BUY_EXEC] }, 1)).toEqual(BUY_EXEC)
  })

  it('unwraps a pjs JSON versioned wrapper ({ vX: [...] })', () => {
    expect(getFailingInstruction({ v4: [WITHDRAW, BUY_EXEC] }, 0)).toEqual(WITHDRAW)
  })

  it('returns undefined when the wrapper does not resolve to an instruction array', () => {
    expect(getFailingInstruction({ type: 'V4', value: 'not-an-array' }, 0)).toBeUndefined()
    expect(getFailingInstruction({}, 0)).toBeUndefined()
  })

  it('returns undefined when the index is out of range', () => {
    expect(getFailingInstruction({ type: 'V4', value: [WITHDRAW] }, 5)).toBeUndefined()
  })

  it('returns undefined when the indexed instruction is not an object', () => {
    expect(getFailingInstruction([1, 2], 0)).toBeUndefined()
  })
})
