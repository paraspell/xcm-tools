import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNode } from '../../utils'
import type BridgeHubPaseo from './BridgeHubPaseo'

describe('BridgeHubPaseo', () => {
  let chain: BridgeHubPaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'BridgeHubPaseo'>('BridgeHubPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('BridgeHubPaseo')
    expect(chain.info).toBe('PaseoBridgeHub')
    expect(chain.type).toBe('paseo')
    expect(chain.version).toBe(Version.V5)
  })
})
