import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TSendInternalOptions } from '../../types'
import { getChain } from '../../utils'
import type PeoplePaseo from './PeoplePaseo'

describe('PeoplePaseo', () => {
  let chain: PeoplePaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'PeoplePaseo'>('PeoplePaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('PeoplePaseo')
    expect(chain.info).toBe('PaseoPeopleChain')
    expect(chain.type).toBe('paseo')
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
