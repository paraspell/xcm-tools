import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type AssetHubPaseo from './AssetHubPaseo'

describe('AssetHubPaseo', () => {
  let chain: AssetHubPaseo<unknown, unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, unknown, 'AssetHubPaseo'>('AssetHubPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('AssetHubPaseo')
    expect(chain.info).toBe('PaseoAssetHub')
    expect(chain.ecosystem).toBe('Paseo')
    expect(chain.version).toBe(Version.V5)
  })
})
