import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type HydrationPaseo from './HydrationPaseo'

describe('HydrationPaseo', () => {
  let chain: HydrationPaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, 'HydrationPaseo'>('HydrationPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('HydrationPaseo')
    expect(chain.info).toBe('rococoHydraDX')
    expect(chain.ecosystem).toBe('Paseo')
    expect(chain.version).toBe(Version.V4)
  })
})
