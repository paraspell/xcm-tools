import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { Version } from '../../types'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import type NeuroWeb from './NeuroWeb'
import { getNode } from '../../utils'

vi.mock('../polkadotXcm', () => ({
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
    expect(neuroweb.version).toBe(Version.V3)
  })

  it('should call transferPolkadotXCM with the correct arguments', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await neuroweb.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'limited_reserve_transfer_assets', 'Unlimited')
  })
})
