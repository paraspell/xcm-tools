import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type CoretimeWestend from './CoretimeWestend'

describe('CoretimeWestend', () => {
  let chain: CoretimeWestend<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, 'CoretimeWestend'>('CoretimeWestend')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('CoretimeWestend')
    expect(chain.info).toBe('westendCoretime')
    expect(chain.type).toBe('westend')
    expect(chain.version).toBe(Version.V5)
  })
})
