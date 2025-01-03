import { describe, it, expect } from 'vitest'
import { getNode } from '.'
import { NODE_NAMES_DOT_KSM } from '../constants'

describe('getNode', () => {
  it('should return node detail for all nodes', () => {
    NODE_NAMES_DOT_KSM.forEach(node => {
      const details = getNode(node)
      expect(details).toBeDefined()
      expect(details.info).toBeTypeOf('string')
      expect(['polkadot', 'kusama']).toContain(details.type)
    })
  })
})
