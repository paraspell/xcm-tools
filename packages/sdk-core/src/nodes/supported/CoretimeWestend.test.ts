import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TScenario, TSendInternalOptions } from '../../types'
import { getNode } from '../../utils'
import type CoretimeWestend from './CoretimeWestend'

describe('CoretimeWestend', () => {
  let chain: CoretimeWestend<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'CoretimeWestend'>('CoretimeWestend')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('CoretimeWestend')
    expect(chain.info).toBe('westendCoretime')
    expect(chain.type).toBe('westend')
    expect(chain.version).toBe(Version.V5)
  })

  it('should keep coretime transfers enabled on Westend', () => {
    const emptyOptions = {} as TSendInternalOptions<unknown, unknown>
    const scenario = 'ParaToPara' as TScenario

    expect(chain.isSendingTempDisabled(emptyOptions)).toBe(false)
    expect(chain.isReceivingTempDisabled(scenario)).toBe(false)
  })
})
