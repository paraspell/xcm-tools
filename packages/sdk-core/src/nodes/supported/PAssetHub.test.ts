import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNode } from '../../utils'
import type PAssetHub from './PAssetHub'

describe('PAssetHub', () => {
  let chain: PAssetHub<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'PAssetHub'>('PAssetHub')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('PAssetHub')
    expect(chain.info).toBe('PAssetHub - Contracts')
    expect(chain.type).toBe('paseo')
    expect(chain.version).toBe(Version.V5)
  })
})
