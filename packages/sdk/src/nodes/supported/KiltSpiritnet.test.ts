import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScenarioNotSupportedError, NodeNotSupportedError } from '../../errors'
import type { PolkadotXCMTransferInput } from '../../types'
import { Version } from '../../types'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import type KiltSpiritnet from './KiltSpiritnet'
import { getNode } from '../../utils'

vi.mock('../polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

describe('KiltSpiritnet', () => {
  let kiltSpiritnet: KiltSpiritnet
  const mockInput = {
    scenario: 'ParaToPara',
    currencySymbol: 'KILT',
    amount: '100'
  } as PolkadotXCMTransferInput

  beforeEach(() => {
    kiltSpiritnet = getNode('KiltSpiritnet')
  })

  it('should initialize with correct values', () => {
    expect(kiltSpiritnet.node).toBe('KiltSpiritnet')
    expect(kiltSpiritnet.name).toBe('kilt')
    expect(kiltSpiritnet.type).toBe('polkadot')
    expect(kiltSpiritnet.version).toBe(Version.V2)
  })

  it('should call transferPolkadotXCM with reserveTransferAssets', () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    kiltSpiritnet.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'reserveTransferAssets')
  })

  it('should throw ScenarioNotSupportedError for unsupported scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToRelay' } as PolkadotXCMTransferInput

    expect(() => kiltSpiritnet.transferPolkadotXCM(invalidInput)).toThrowError(
      ScenarioNotSupportedError
    )
  })

  it('should throw NodeNotSupportedError for transferRelayToPara', () => {
    expect(() => kiltSpiritnet.transferRelayToPara()).toThrowError(NodeNotSupportedError)
  })
})
