import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type AssetHubWestend from './AssetHubWestend'

describe('AssetHubWestend', () => {
  let chain: AssetHubWestend<unknown, unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, unknown, 'AssetHubWestend'>('AssetHubWestend')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('AssetHubWestend')
    expect(chain.info).toBe('WestendAssetHub')
    expect(chain.ecosystem).toBe('Westend')
    expect(chain.version).toBe(Version.V5)
  })
})
