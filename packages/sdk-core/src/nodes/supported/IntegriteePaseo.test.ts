import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNode } from '../../utils'
import type IntegriteePaseo from './IntegriteePaseo'

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
}))

describe('IntegriteePaseo', () => {
  let chain: IntegriteePaseo<unknown, unknown>

  beforeEach(() => {
    chain = getNode<unknown, unknown, 'IntegriteePaseo'>('IntegriteePaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('IntegriteePaseo')
    expect(chain.info).toBe('integritee')
    expect(chain.type).toBe('paseo')
    expect(chain.version).toBe(Version.V4)
  })
})
