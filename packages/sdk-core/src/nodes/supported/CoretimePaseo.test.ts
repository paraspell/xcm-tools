import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNode } from '../../utils'
import type CoretimePaseo from './CoretimePaseo'

describe('CoretimePaseo', () => {
  let chain: CoretimePaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'CoretimePaseo'>('CoretimePaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('CoretimePaseo')
    expect(chain.info).toBe('PaseoCoretime')
    expect(chain.type).toBe('paseo')
    expect(chain.version).toBe(Version.V5)
  })
})
