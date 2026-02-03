import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type BridgeHubPaseo from './BridgeHubPaseo'

describe('BridgeHubPaseo', () => {
  let chain: BridgeHubPaseo<unknown, unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, unknown, 'BridgeHubPaseo'>('BridgeHubPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('BridgeHubPaseo')
    expect(chain.info).toBe('PaseoBridgeHub')
    expect(chain.ecosystem).toBe('Paseo')
    expect(chain.version).toBe(Version.V5)
  })
})
