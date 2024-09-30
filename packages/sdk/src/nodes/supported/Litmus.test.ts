import { describe, it, expect, beforeEach } from 'vitest'
import { getNode } from '../../utils'
import Litmus from './Litmus'

describe('Litmus', () => {
  let litmus: Litmus

  beforeEach(() => {
    litmus = getNode('Litmus')
  })

  it('should be instantiated correctly', () => {
    expect(litmus).toBeInstanceOf(Litmus)
  })

  describe('getProvider', () => {
    it('should return the correct provider URL', () => {
      const provider = litmus.getProvider()
      expect(provider).toBe('wss:///rpc.litmus-parachain.litentry.io')
    })
  })
})
