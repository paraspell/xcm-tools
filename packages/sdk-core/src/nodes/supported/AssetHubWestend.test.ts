import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TScenario, TSendInternalOptions } from '../../types'
import { getNode } from '../../utils'
import type AssetHubWestend from './AssetHubWestend'

describe('AssetHubWestend', () => {
  let chain: AssetHubWestend<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'AssetHubWestend'>('AssetHubWestend')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('AssetHubWestend')
    expect(chain.info).toBe('WestendAssetHub')
    expect(chain.type).toBe('westend')
    expect(chain.version).toBe(Version.V5)
  })

  it('should keep transfers enabled on Westend AssetHub', () => {
    const emptyOptions = {} as TSendInternalOptions<unknown, unknown>
    const scenario = 'ParaToPara' as TScenario

    expect(chain.isSendingTempDisabled(emptyOptions)).toBe(false)
    expect(chain.isReceivingTempDisabled(scenario)).toBe(false)
  })
})
