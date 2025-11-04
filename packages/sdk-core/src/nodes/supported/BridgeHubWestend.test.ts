import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TScenario, TSendInternalOptions } from '../../types'
import { getNode } from '../../utils'
import type BridgeHubWestend from './BridgeHubWestend'

describe('BridgeHubWestend', () => {
  let chain: BridgeHubWestend<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'BridgeHubWestend'>('BridgeHubWestend')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('BridgeHubWestend')
    expect(chain.info).toBe('westendBridgeHub')
    expect(chain.type).toBe('westend')
    expect(chain.version).toBe(Version.V5)
  })

  it('should allow sending and receiving on westend bridge hub', () => {
    const emptyOptions = {} as TSendInternalOptions<unknown, unknown>
    const scenario = 'ParaToPara' as TScenario

    expect(chain.isSendingTempDisabled(emptyOptions)).toBe(false)
    expect(chain.isReceivingTempDisabled(scenario)).toBe(false)
  })
})
