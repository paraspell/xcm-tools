import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScenarioNotSupportedError, NodeNotSupportedError } from '../../errors'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { Version } from '../../types'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import type KiltSpiritnet from './KiltSpiritnet'
import { getNode } from '../../utils'

vi.mock('../../pallets/polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

describe('KiltSpiritnet', () => {
  let kiltSpiritnet: KiltSpiritnet<unknown, unknown>
  const mockInput = {
    scenario: 'ParaToPara',
    asset: {
      symbol: 'KILT',
      amount: '100'
    }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    kiltSpiritnet = getNode<unknown, unknown, 'KiltSpiritnet'>('KiltSpiritnet')
  })

  it('should initialize with correct values', () => {
    expect(kiltSpiritnet.node).toBe('KiltSpiritnet')
    expect(kiltSpiritnet.info).toBe('kilt')
    expect(kiltSpiritnet.type).toBe('polkadot')
    expect(kiltSpiritnet.version).toBe(Version.V2)
  })

  it('should call transferPolkadotXCM with reserveTransferAssets', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await kiltSpiritnet.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'reserve_transfer_assets')
  })

  it('should throw ScenarioNotSupportedError for unsupported scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<
      unknown,
      unknown
    >

    expect(() => kiltSpiritnet.transferPolkadotXCM(invalidInput)).toThrowError(
      ScenarioNotSupportedError
    )
  })

  it('should throw NodeNotSupportedError for transferRelayToPara', () => {
    expect(() => kiltSpiritnet.transferRelayToPara()).toThrowError(NodeNotSupportedError)
  })
})
