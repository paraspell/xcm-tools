import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNode } from '../../utils'
import type CollectivesWestend from './CollectivesWestend'

describe('CollectivesWestend', () => {
  let chain: CollectivesWestend<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'CollectivesWestend'>('CollectivesWestend')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('CollectivesWestend')
    expect(chain.info).toBe('westendCollectives')
    expect(chain.type).toBe('westend')
    expect(chain.version).toBe(Version.V5)
  })
})
