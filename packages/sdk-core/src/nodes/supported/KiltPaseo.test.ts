import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNode } from '../../utils'
import type KiltPaseo from './KiltPaseo'

describe('KiltPaseo', () => {
  let chain: KiltPaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'KiltPaseo'>('KiltPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('KiltPaseo')
    expect(chain.info).toBe('kilt')
    expect(chain.type).toBe('paseo')
    expect(chain.version).toBe(Version.V4)
  })
})
