import { describe, it, expect } from 'vitest'
import { checkKeepAlive, createTx } from './'

describe('Module exports', () => {
  it('should export all expected functions from checkKeepAlive', () => {
    expect(checkKeepAlive).toBeDefined()
  })

  it('should export all expected functions from createTx', () => {
    expect(createTx).toBeDefined()
  })
})
