import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNode } from '../../utils'
import type NodlePaseo from './NodlePaseo'

describe('NodlePaseo', () => {
  let chain: NodlePaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'NodlePaseo'>('NodlePaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('NodlePaseo')
    expect(chain.info).toBe('NodleParadis')
    expect(chain.type).toBe('paseo')
    expect(chain.version).toBe(Version.V4)
  })
})
