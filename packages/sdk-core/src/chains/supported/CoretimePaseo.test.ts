import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TSendInternalOptions } from '../../types'
import { getChain } from '../../utils'
import type CoretimePaseo from './CoretimePaseo'

describe('CoretimePaseo', () => {
  let chain: CoretimePaseo<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, 'CoretimePaseo'>('CoretimePaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('CoretimePaseo')
    expect(chain.info).toBe('PaseoCoretime')
    expect(chain.ecosystem).toBe('Paseo')
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
