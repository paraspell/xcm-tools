import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNode } from '../../utils'
import type AjunaPaseo from './AjunaPaseo'

describe('AjunaPaseo', () => {
  let chain: AjunaPaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'AjunaPaseo'>('AjunaPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('AjunaPaseo')
    expect(chain.info).toBe('Ajuna(paseo)')
    expect(chain.type).toBe('paseo')
    expect(chain.version).toBe(Version.V4)
  })
})
