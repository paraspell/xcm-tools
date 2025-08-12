import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type KiltPaseo from './KiltPaseo'

describe('KiltPaseo', () => {
  let chain: KiltPaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, 'KiltPaseo'>('KiltPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('KiltPaseo')
    expect(chain.info).toBe('kilt')
    expect(chain.ecosystem).toBe('Paseo')
    expect(chain.version).toBe(Version.V4)
  })
})
