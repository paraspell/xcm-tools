import { PARACHAINS, RELAYCHAINS } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { getChain } from '.'

describe('getChain', () => {
  it('should return chain detail for all parachains', () => {
    PARACHAINS.forEach(chain => {
      const details = getChain(chain)
      expect(details).toBeDefined()
      expect(details.info).toBeTypeOf('string')
      expect(RELAYCHAINS).toContain(details.ecosystem)
    })
  })
})
