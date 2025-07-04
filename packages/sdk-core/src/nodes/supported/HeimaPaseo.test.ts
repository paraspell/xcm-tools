import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNode } from '../../utils'
import type HeimaPaseo from './HeimaPaseo'

describe('HeimaPaseo', () => {
  let chain: HeimaPaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'HeimaPaseo'>('HeimaPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('HeimaPaseo')
    expect(chain.info).toBe('heima-paseo')
    expect(chain.type).toBe('paseo')
    expect(chain.version).toBe(Version.V4)
  })
})
