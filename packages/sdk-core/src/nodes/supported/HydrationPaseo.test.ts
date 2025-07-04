import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNode } from '../../utils'
import type HydrationPaseo from './HydrationPaseo'

describe('HydrationPaseo', () => {
  let chain: HydrationPaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'HydrationPaseo'>('HydrationPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('HydrationPaseo')
    expect(chain.info).toBe('rococoHydraDX')
    expect(chain.type).toBe('paseo')
    expect(chain.version).toBe(Version.V4)
  })
})
