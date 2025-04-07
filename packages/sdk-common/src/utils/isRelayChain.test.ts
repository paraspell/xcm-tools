import { describe, expect, it } from 'vitest'

import { NODE_NAMES } from '../constants'
import { isRelayChain } from './isRelayChain'

describe('isRelayChain', () => {
  it('should return true for Polkadot', () => {
    const result = isRelayChain('Polkadot')
    expect(result).toBe(true)
  })

  it('should return true for Kusama', () => {
    const result = isRelayChain('Kusama')
    expect(result).toBe(true)
  })

  NODE_NAMES.forEach(node => {
    it(`should return false for ${node}`, () => {
      const result = isRelayChain(node)
      expect(result).toBe(false)
    })
  })
})
