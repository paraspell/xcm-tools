import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type PAssetHub from './PAssetHub'

describe('PAssetHub', () => {
  let chain: PAssetHub<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, 'PAssetHub'>('PAssetHub')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('PAssetHub')
    expect(chain.info).toBe('PAssetHub - Contracts')
    expect(chain.ecosystem).toBe('Paseo')
    expect(chain.version).toBe(Version.V5)
  })
})
