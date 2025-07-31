import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type NeuroWebPaseo from './NeuroWebPaseo'

describe('NeuroWebPaseo', () => {
  let chain: NeuroWebPaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, 'NeuroWebPaseo'>('NeuroWebPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('NeuroWebPaseo')
    expect(chain.info).toBe('NeuroWeb')
    expect(chain.type).toBe('paseo')
    expect(chain.version).toBe(Version.V4)
  })
})
