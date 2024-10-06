import { describe, it, expect } from 'vitest'
import { checkPlanFailure } from './checkPlanFailure'
import type { SendValidationResult } from '@snowbridge/api/dist/toPolkadot'

describe('checkPlanFailure', () => {
  it('throws an error with the correct message when plan.failure is true', () => {
    const plan = {
      failure: {
        errors: [{ message: 'Invalid recipient address' }, { message: 'Insufficient balance' }]
      }
    }

    const testFunc = () => checkPlanFailure(plan as SendValidationResult)

    expect(testFunc).toThrow(Error)
    expect(testFunc).toThrow(
      'Failed to validate send: Invalid recipient address\n\nInsufficient balance'
    )
  })

  it('does not throw an error when plan.failure is false', () => {
    const plan = { failure: undefined } as SendValidationResult
    expect(() => checkPlanFailure(plan)).not.toThrow()
  })
})
