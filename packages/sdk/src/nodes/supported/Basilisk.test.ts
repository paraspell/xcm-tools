import { describe, it, expect, beforeEach } from 'vitest'
import { getNode } from '../../utils'
import Basilisk from './Basilisk'

describe('Basilisk', () => {
  let basilisk: Basilisk

  beforeEach(() => {
    basilisk = getNode('Basilisk')
  })

  it('should be instantiated correctly', () => {
    expect(basilisk).toBeInstanceOf(Basilisk)
  })

  describe('getProvider', () => {
    it('should return the correct provider URL', () => {
      const provider = basilisk.getProvider()
      expect(provider).toContain('dwellir')
    })
  })
})
