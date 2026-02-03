import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TSendInternalOptions } from '../../types'
import { getChain } from '../../utils'
import type PAssetHub from './PAssetHub'

describe('PAssetHub', () => {
  let chain: PAssetHub<unknown, unknown, unknown>

  const sendOptions = {} as unknown as TSendInternalOptions<unknown, unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, unknown, 'PAssetHub'>('PAssetHub')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('PAssetHub')
    expect(chain.info).toBe('PAssetHub - Contracts')
    expect(chain.ecosystem).toBe('Paseo')
    expect(chain.version).toBe(Version.V5)
  })

  it('isSendingTempDisabled should return true', () => {
    expect(chain.isSendingTempDisabled(sendOptions)).toBe(true)
  })

  it('isReceivingTempDisabled should return true', () => {
    expect(chain.isReceivingTempDisabled('ParaToPara')).toBe(true)
  })
})
