import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TScenario, TSendInternalOptions } from '../../types'
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

  it('should allow sending and receiving while Polkadot bridge is disabled', () => {
    const emptyOptions = {} as TSendInternalOptions<unknown, unknown>
    const scenario = 'ParaToPara' as TScenario

    expect(chain.isSendingTempDisabled(emptyOptions)).toBe(false)
    expect(chain.isReceivingTempDisabled(scenario)).toBe(false)
  })
})
