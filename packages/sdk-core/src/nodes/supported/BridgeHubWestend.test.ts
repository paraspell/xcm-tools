import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TSendInternalOptions } from '../../types'
import { getChain } from '../../utils'
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

  it('isSendingTempDisabled should return false', () => {
    const options = {} as TSendInternalOptions<unknown, unknown>
    expect(chain.isSendingTempDisabled(options)).toBe(false)
  })

  it('isReceivingTempDisabled should return false', () => {
    expect(chain.isReceivingTempDisabled('ParaToPara')).toBe(false)
  })
})
