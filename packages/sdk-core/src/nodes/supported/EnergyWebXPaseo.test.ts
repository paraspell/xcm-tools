import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNode } from '../../utils/getNode'
import type EnergyWebXPaseo from './EnergyWebXPaseo'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

describe('EnergyWebXPaseo', () => {
  let chain: EnergyWebXPaseo<unknown, unknown>

  beforeEach(() => {
    chain = getNode<unknown, unknown, 'EnergyWebXPaseo'>('EnergyWebXPaseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('EnergyWebXPaseo')
    expect(chain.info).toBe('paseoEwx')
    expect(chain.type).toBe('paseo')
    expect(chain.version).toBe(Version.V3)
  })
})
