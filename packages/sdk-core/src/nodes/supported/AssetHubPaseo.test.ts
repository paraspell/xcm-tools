import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TScenario, TSendInternalOptions } from '../../types'
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
    expect(chain.version).toBe(Version.V5)
  })

  it('should not mark sending or receiving as temporarily disabled', () => {
    const emptyOptions = {} as TSendInternalOptions<unknown, unknown>
    const scenario = 'ParaToPara' as TScenario

    expect(chain.isSendingTempDisabled(emptyOptions)).toBe(false)
    expect(chain.isReceivingTempDisabled(scenario)).toBe(false)
  })
})
