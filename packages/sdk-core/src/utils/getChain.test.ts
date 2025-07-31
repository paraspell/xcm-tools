import { CHAIN_NAMES_DOT_KSM } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { getChain } from '.'

describe('getChain', () => {
  it('should return chain detail for all chains', () => {
    CHAIN_NAMES_DOT_KSM.forEach(chain => {
      const details = getChain(chain)
      expect(details).toBeDefined()
      expect(details.info).toBeTypeOf('string')
      expect(['polkadot', 'kusama', 'westend', 'paseo']).toContain(details.type)
    })
  })
})
