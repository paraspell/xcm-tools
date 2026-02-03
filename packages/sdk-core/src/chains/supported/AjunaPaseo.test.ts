import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type AjunaPaseo from './AjunaPaseo'

vi.mock('../../pallets/polkadotXcm')

describe('AjunaPaseo', () => {
  let chain: AjunaPaseo<unknown, unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, unknown, 'AjunaPaseo'>('AjunaPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('AjunaPaseo')
    expect(chain.info).toBe('Ajuna(paseo)')
    expect(chain.ecosystem).toBe('Paseo')
    expect(chain.version).toBe(Version.V5)
  })
})
