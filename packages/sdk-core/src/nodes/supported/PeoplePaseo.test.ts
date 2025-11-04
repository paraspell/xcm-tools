import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TScenario, TSendInternalOptions } from '../../types'
import { getNode } from '../../utils'
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

  it('should keep people chain transfers enabled on Paseo', () => {
    const emptyOptions = {} as TSendInternalOptions<unknown, unknown>
    const scenario = 'ParaToPara' as TScenario

    expect(chain.isSendingTempDisabled(emptyOptions)).toBe(false)
    expect(chain.isReceivingTempDisabled(scenario)).toBe(false)
  })
})
