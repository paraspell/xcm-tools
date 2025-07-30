import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type NodlePaseo from './NodlePaseo'

describe('NodlePaseo', () => {
  let chain: NodlePaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, 'NodlePaseo'>('NodlePaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('NodlePaseo')
    expect(chain.info).toBe('NodleParadis')
    expect(chain.type).toBe('paseo')
    expect(chain.version).toBe(Version.V4)
  })
})
