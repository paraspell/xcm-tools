import { describe, it, expect } from 'vitest'
import { getNode } from '.'
import { NODE_NAMES } from '../maps/consts'

describe('getNode', () => {
  it('should return node detail for all nodes', () => {
    NODE_NAMES.forEach(node => {
      const details = getNode(node)
      expect(details).toBeDefined()
      expect(details.name).toBeTypeOf('string')
      expect(['polkadot', 'kusama']).toContain(details.type)
    })
  })
})
