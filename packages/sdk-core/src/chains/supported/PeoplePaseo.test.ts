import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type PeoplePaseo from './PeoplePaseo'

describe('PeoplePaseo', () => {
  let chain: PeoplePaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, 'PeoplePaseo'>('PeoplePaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('PeoplePaseo')
    expect(chain.info).toBe('PaseoPeopleChain')
    expect(chain.ecosystem).toBe('Paseo')
    expect(chain.version).toBe(Version.V5)
  })
})
