import { describe, expect, it } from 'vitest'

import { ParaSpellError } from './ParaSpellError'

describe('ParaSpellError', () => {
  it('preserves standard Error behavior', () => {
    const error = new ParaSpellError('Invalid request')

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('ParaSpellError')
    expect(error.message).toBe('Invalid request')
  })

  it('uses the concrete subclass name', () => {
    class ExampleError extends ParaSpellError {}

    expect(new ExampleError('Example').name).toBe('ExampleError')
  })
})
