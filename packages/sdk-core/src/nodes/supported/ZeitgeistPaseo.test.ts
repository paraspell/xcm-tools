import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNode } from '../../utils'
import type ZeitgeistPaseo from './ZeitgeistPaseo'

describe('ZeitgeistPaseo', () => {
  let chain: ZeitgeistPaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'ZeitgeistPaseo'>('ZeitgeistPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('ZeitgeistPaseo')
    expect(chain.info).toBe('ZeitgeistBatteryStation')
    expect(chain.type).toBe('paseo')
    expect(chain.version).toBe(Version.V3)
  })
})
