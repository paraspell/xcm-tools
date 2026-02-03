import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type BifrostPaseo from './BifrostPaseo'

describe('BifrostPaseo', () => {
  let chain: BifrostPaseo<unknown, unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, unknown, 'BifrostPaseo'>('BifrostPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('BifrostPaseo')
    expect(chain.info).toBe('Bifrost(Paseo)')
    expect(chain.ecosystem).toBe('Paseo')
    expect(chain.version).toBe(Version.V5)
  })
})
