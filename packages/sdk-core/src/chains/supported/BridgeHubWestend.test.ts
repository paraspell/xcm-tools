import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type BridgeHubWestend from './BridgeHubWestend'

describe('BridgeHubWestend', () => {
  let chain: BridgeHubWestend<unknown, unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, unknown, 'BridgeHubWestend'>('BridgeHubWestend')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('BridgeHubWestend')
    expect(chain.info).toBe('westendBridgeHub')
    expect(chain.ecosystem).toBe('Westend')
    expect(chain.version).toBe(Version.V5)
  })
})
