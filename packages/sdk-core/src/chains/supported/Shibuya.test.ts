import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type Shibuya from './Shibuya'

describe('Shibuya', () => {
  let chain: Shibuya<unknown, unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, unknown, 'Shibuya'>('Shibuya')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Shibuya')
    expect(chain.info).toBe('PaseoShibuyaChain')
    expect(chain.ecosystem).toBe('Paseo')
    expect(chain.version).toBe(Version.V5)
  })
})
