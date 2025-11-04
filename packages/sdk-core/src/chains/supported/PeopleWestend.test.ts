import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TSendInternalOptions } from '../../types'
import { getChain } from '../../utils'
import type PeopleWestend from './PeopleWestend'

describe('PeopleWestend', () => {
  let chain: PeopleWestend<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, 'PeopleWestend'>('PeopleWestend')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('PeopleWestend')
    expect(chain.info).toBe('westendPeople')
    expect(chain.ecosystem).toBe('Westend')
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
