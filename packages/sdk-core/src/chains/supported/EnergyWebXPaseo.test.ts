import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils/getChain'
import type EnergyWebXPaseo from './EnergyWebXPaseo'

vi.mock('../../pallets/polkadotXcm')

describe('EnergyWebXPaseo', () => {
  let chain: EnergyWebXPaseo<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'EnergyWebXPaseo'>('EnergyWebXPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('EnergyWebXPaseo')
    expect(chain.info).toBe('paseoEwx')
    expect(chain.ecosystem).toBe('Paseo')
    expect(chain.version).toBe(Version.V3)
  })
})
