import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TSendInternalOptions } from '../../types'
import { getChain } from '../../utils'
import type KiltPaseo from './KiltPaseo'

describe('KiltPaseo', () => {
  let chain: KiltPaseo<unknown, unknown>

  const sendOptions = {} as unknown as TSendInternalOptions<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, 'KiltPaseo'>('KiltPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('KiltPaseo')
    expect(chain.info).toBe('kilt')
    expect(chain.ecosystem).toBe('Paseo')
    expect(chain.version).toBe(Version.V4)
  })

  it('isSendingTempDisabled should return true', () => {
    expect(chain.isSendingTempDisabled(sendOptions)).toBe(true)
  })

  it('isReceivingTempDisabled should return true', () => {
    expect(chain.isReceivingTempDisabled('ParaToPara')).toBe(true)
  })
})
