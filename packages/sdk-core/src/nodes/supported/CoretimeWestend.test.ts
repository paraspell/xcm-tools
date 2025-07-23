import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNode } from '../../utils'
import type CoretimeWestend from './CoretimeWestend'

describe('CoretimeWestend', () => {
  let chain: CoretimeWestend<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'CoretimeWestend'>('CoretimeWestend')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('CoretimeWestend')
    expect(chain.info).toBe('westendCoretime')
    expect(chain.type).toBe('westend')
    expect(chain.version).toBe(Version.V5)
  })
})
