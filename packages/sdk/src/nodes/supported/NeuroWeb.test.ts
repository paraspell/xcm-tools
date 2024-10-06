import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PolkadotXCMTransferInput } from '../../types'
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
  let neuroweb: NeuroWeb
  const mockInput = {
    currencySymbol: 'DOT',
    amount: '100'
  } as PolkadotXCMTransferInput

  beforeEach(() => {
    neuroweb = getNode('NeuroWeb')
  })

  it('should initialize with correct values', () => {
    expect(neuroweb.node).toBe('NeuroWeb')
    expect(neuroweb.name).toBe('neuroweb')
    expect(neuroweb.type).toBe('polkadot')
    expect(neuroweb.version).toBe(Version.V3)
  })

  it('should call transferPolkadotXCM with the correct arguments', () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    neuroweb.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'limitedReserveTransferAssets', 'Unlimited')
  })
})
