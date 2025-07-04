import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNode } from '../../utils'
import type AssetHubPaseo from './AssetHubPaseo'

describe('AssetHubPaseo', () => {
  let chain: AssetHubPaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'AssetHubPaseo'>('AssetHubPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('AssetHubPaseo')
    expect(chain.info).toBe('PaseoAssetHub')
    expect(chain.type).toBe('paseo')
    expect(chain.version).toBe(Version.V4)
  })
})
