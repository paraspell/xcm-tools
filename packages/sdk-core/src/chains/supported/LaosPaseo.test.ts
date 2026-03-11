import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type LaosPaseo from './LaosPaseo'

describe('LaosPaseo', () => {
  let chain: LaosPaseo<unknown, unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, unknown, 'LaosPaseo'>('LaosPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('LaosPaseo')
    expect(chain.info).toBe('laos-sigma')
    expect(chain.ecosystem).toBe('Paseo')
    expect(chain.version).toBe(Version.V4)
  })
})
