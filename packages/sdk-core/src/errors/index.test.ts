import { describe, expect, it } from 'vitest'

import { RuntimeApiError } from './RuntimeApiError'
import { RuntimeApiUnavailableError } from './RuntimeApiUnavailable'

describe('RuntimeApiUnavailableError', () => {
  it('sets message and name with provided chain and api name', () => {
    const error = new RuntimeApiUnavailableError('Acala', 'DryRunApi')

    expect(error.message).toBe('Runtime API "DryRunApi" is not available on chain Acala')
    expect(error.name).toBe('RuntimeApiUnavailableError')
  })
})

describe('RuntimeApiError', () => {
  it('sets message and name with provided chain, api name, and details', () => {
    const error = new RuntimeApiError(
      'Failed to execute DryRunApi on chain Acala: Execution failed'
    )

    expect(error.message).toBe('Failed to execute DryRunApi on chain Acala: Execution failed')
    expect(error.name).toBe('RuntimeApiError')
  })
})
