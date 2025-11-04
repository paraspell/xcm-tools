import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type CollectivesWestend from './CollectivesWestend'

describe('CollectivesWestend', () => {
  let chain: CollectivesWestend<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, 'CollectivesWestend'>('CollectivesWestend')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('CollectivesWestend')
    expect(chain.info).toBe('westendCollectives')
    expect(chain.ecosystem).toBe('Westend')
    expect(chain.version).toBe(Version.V5)
  })
})
