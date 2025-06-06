import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import type NeuroWeb from './NeuroWeb'

vi.mock('../../pallets/polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

describe('NeuroWeb', () => {
  let neuroweb: NeuroWeb<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'DOT', amount: '100' }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    neuroweb = getNode<unknown, unknown, 'NeuroWeb'>('NeuroWeb')
  })

  it('should initialize with correct values', () => {
    expect(neuroweb.node).toBe('NeuroWeb')
    expect(neuroweb.info).toBe('neuroweb')
    expect(neuroweb.type).toBe('polkadot')
    expect(neuroweb.version).toBe(Version.V4)
  })

  it('should call transferPolkadotXCM with the correct arguments', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await neuroweb.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'limited_reserve_transfer_assets', 'Unlimited')
  })
})
