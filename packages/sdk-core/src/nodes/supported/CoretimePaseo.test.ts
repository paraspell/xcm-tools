import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TScenario, TSendInternalOptions } from '../../types'
import { getNode } from '../../utils'
import type CoretimePaseo from './CoretimePaseo'

describe('CoretimePaseo', () => {
  let chain: CoretimePaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'CoretimePaseo'>('CoretimePaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('CoretimePaseo')
    expect(chain.info).toBe('PaseoCoretime')
    expect(chain.type).toBe('paseo')
    expect(chain.version).toBe(Version.V5)
  })

  it('should keep coretime transfers enabled on Paseo', () => {
    const emptyOptions = {} as TSendInternalOptions<unknown, unknown>
    const scenario = 'ParaToPara' as TScenario

    expect(chain.isSendingTempDisabled(emptyOptions)).toBe(false)
    expect(chain.isReceivingTempDisabled(scenario)).toBe(false)
  })
})
