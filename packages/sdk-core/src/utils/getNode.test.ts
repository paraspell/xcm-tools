import { NODE_NAMES_DOT_KSM } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { getNode } from '.'

describe('getNode', () => {
  it('should return node detail for all nodes', () => {
    NODE_NAMES_DOT_KSM.forEach(node => {
      const details = getNode(node)
      expect(details).toBeDefined()
      expect(details.info).toBeTypeOf('string')
      expect(['polkadot', 'kusama', 'westend', 'paseo']).toContain(details.type)
    })
  })
})
