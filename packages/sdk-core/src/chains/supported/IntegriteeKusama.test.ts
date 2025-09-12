import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils/getChain'
import type IntegriteeKusama from './IntegriteeKusama'

describe('IntegriteeKusama', () => {
  let chain: IntegriteeKusama<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'IntegriteeKusama'>('IntegriteeKusama')
    vi.clearAllMocks()
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('IntegriteeKusama')
    expect(chain.info).toBe('integritee')
    expect(chain.ecosystem).toBe('Kusama')
    expect(chain.version).toBe(Version.V5)
  })
})
