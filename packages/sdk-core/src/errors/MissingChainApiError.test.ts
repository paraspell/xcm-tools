import { describe, expect, it } from 'vitest'

import { MissingChainApiError } from './MissingChainApiError'

describe('MissingChainApiError', () => {
  it('should create an error with correct message and name', () => {
    const fakeChain = 'Polkadot'
    const error = new MissingChainApiError(fakeChain)

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('MissingChainApiError')
    expect(error.message).toContain('Development mode requires an API override for Polkadot')
  })
})
