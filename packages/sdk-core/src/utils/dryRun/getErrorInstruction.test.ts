import { describe, expect, it } from 'vitest'

import { buildDryRunError, getErrorInstruction } from './getErrorInstruction'

const WITHDRAW = { type: 'WithdrawAsset', value: [] }
const BUY_EXEC = { type: 'BuyExecution', value: {} }

describe('getErrorInstruction', () => {
  it('returns undefined when index is undefined', () => {
    expect(getErrorInstruction({ type: 'V4', value: [WITHDRAW] }, undefined)).toBeUndefined()
  })

  it('returns undefined when message is null or not an object', () => {
    expect(getErrorInstruction(null, 0)).toBeUndefined()
    expect(getErrorInstruction(undefined, 0)).toBeUndefined()
    expect(getErrorInstruction(42, 0)).toBeUndefined()
  })

  it('indexes a raw instruction array', () => {
    expect(getErrorInstruction([WITHDRAW, BUY_EXEC], 1)).toEqual(BUY_EXEC)
  })

  it('unwraps a PAPI/dedot versioned wrapper ({ type, value: [...] })', () => {
    expect(getErrorInstruction({ type: 'V4', value: [WITHDRAW, BUY_EXEC] }, 1)).toEqual(BUY_EXEC)
  })

  it('unwraps a pjs JSON versioned wrapper ({ vX: [...] })', () => {
    expect(getErrorInstruction({ v4: [WITHDRAW, BUY_EXEC] }, 0)).toEqual(WITHDRAW)
  })

  it('returns undefined when the wrapper does not resolve to an instruction array', () => {
    expect(getErrorInstruction({ type: 'V4', value: 'not-an-array' }, 0)).toBeUndefined()
    expect(getErrorInstruction({}, 0)).toBeUndefined()
  })

  it('returns undefined when the index is out of range', () => {
    expect(getErrorInstruction({ type: 'V4', value: [WITHDRAW] }, 5)).toBeUndefined()
  })

  it('returns undefined when the indexed instruction is not an object', () => {
    expect(getErrorInstruction([1, 2], 0)).toBeUndefined()
  })
})

describe('buildDryRunError', () => {
  it('resolves the failing instruction from the message using the instruction index', () => {
    expect(
      buildDryRunError({ reason: 'Barrier', instructionIndex: 1 }, [WITHDRAW, BUY_EXEC])
    ).toEqual({ reason: 'Barrier', instructionIndex: 1, instruction: BUY_EXEC })
  })

  it('preserves the sub-reason and sets instruction to undefined when there is no index', () => {
    expect(
      buildDryRunError({ reason: 'LocalExecutionIncomplete', subReason: 'TooExpensive' }, [
        WITHDRAW
      ])
    ).toEqual({
      reason: 'LocalExecutionIncomplete',
      subReason: 'TooExpensive',
      instruction: undefined
    })
  })

  it('sets instruction to undefined when the message has no matching instruction', () => {
    expect(buildDryRunError({ reason: 'Unknown error', instructionIndex: 5 }, [WITHDRAW])).toEqual({
      reason: 'Unknown error',
      instructionIndex: 5,
      instruction: undefined
    })
  })
})
