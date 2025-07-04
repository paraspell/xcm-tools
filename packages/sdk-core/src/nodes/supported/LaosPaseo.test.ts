import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNode } from '../../utils'
import type LaosPaseo from './LaosPaseo'

describe('LaosPaseo', () => {
  let chain: LaosPaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'LaosPaseo'>('LaosPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('LaosPaseo')
    expect(chain.info).toBe('laos-sigma')
    expect(chain.type).toBe('paseo')
    expect(chain.version).toBe(Version.V4)
  })
})
