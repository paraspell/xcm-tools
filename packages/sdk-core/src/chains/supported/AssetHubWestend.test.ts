import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type AssetHubWestend from './AssetHubWestend'

describe('AssetHubWestend', () => {
  let chain: AssetHubWestend<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, 'AssetHubPolkadot'>('AssetHubPolkadot')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('AssetHubPolkadot')
    expect(chain.info).toBe('PolkadotAssetHub')
    expect(chain.type).toBe('polkadot')
    expect(chain.version).toBe(Version.V5)
  })
})
