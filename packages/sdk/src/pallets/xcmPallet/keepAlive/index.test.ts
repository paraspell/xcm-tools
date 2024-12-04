import { describe, it, expect } from 'vitest'
import { checkKeepAlive } from './'

describe('Module exports', () => {
  it('should export all expected functions from checkKeepAlive', () => {
    expect(checkKeepAlive).toBeDefined()
  })
})
