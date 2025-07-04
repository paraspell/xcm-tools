import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNode } from '../../utils'
import type BifrostPaseo from './BifrostPaseo'

describe('BifrostPaseo', () => {
  let chain: BifrostPaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'BifrostPaseo'>('BifrostPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('BifrostPaseo')
    expect(chain.info).toBe('Bifrost(Paseo)')
    expect(chain.type).toBe('paseo')
    expect(chain.version).toBe(Version.V4)
  })
})
