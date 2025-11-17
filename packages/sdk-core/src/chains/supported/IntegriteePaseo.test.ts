import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type IntegriteePaseo from './IntegriteePaseo'

vi.mock('../../pallets/xTokens')

describe('IntegriteePaseo', () => {
  let chain: IntegriteePaseo<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'IntegriteePaseo'>('IntegriteePaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('IntegriteePaseo')
    expect(chain.info).toBe('integritee')
    expect(chain.ecosystem).toBe('Paseo')
    expect(chain.version).toBe(Version.V4)
  })
})
