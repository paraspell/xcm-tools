import { describe, expect, it } from 'vitest'

import { RuntimeApiUnavailableError } from './RuntimeApiUnavailable'

describe('RuntimeApiUnavailableError', () => {
  it('sets message and name with provided chain and api name', () => {
    const error = new RuntimeApiUnavailableError('Acala', 'DryRunApi')

    expect(error.message).toBe('Runtime API "DryRunApi" is not available on chain Acala')
    expect(error.name).toBe('RuntimeApiUnavailableError')
  })
})
