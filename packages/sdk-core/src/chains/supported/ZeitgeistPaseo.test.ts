import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type ZeitgeistPaseo from './ZeitgeistPaseo'

describe('ZeitgeistPaseo', () => {
  let chain: ZeitgeistPaseo<unknown, unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, unknown, 'ZeitgeistPaseo'>('ZeitgeistPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('ZeitgeistPaseo')
    expect(chain.info).toBe('ZeitgeistBatteryStation')
    expect(chain.ecosystem).toBe('Paseo')
    expect(chain.version).toBe(Version.V4)
  })
})
