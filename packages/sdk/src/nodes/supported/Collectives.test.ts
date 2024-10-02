import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScenarioNotSupportedError } from '../../errors'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import { PolkadotXCMTransferInput, TRelayToParaInternalOptions, Version } from '../../types'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import Collectives from './Collectives'
import { getNode } from '../../utils/getNode'

vi.mock('../polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  constructRelayToParaParameters: vi.fn()
}))

describe('Collectives', () => {
  let collectives: Collectives
  const mockInput = {
    scenario: 'RelayToPara',
    currencySymbol: 'DOT',
    amount: '100'
  } as PolkadotXCMTransferInput

  const mockOptions = {
    destination: 'Collectives'
  } as TRelayToParaInternalOptions

  beforeEach(() => {
    collectives = getNode('Collectives')
  })

  it('should initialize with correct values', () => {
    expect(collectives.node).toBe('Collectives')
    expect(collectives.name).toBe('polkadotCollectives')
    expect(collectives.type).toBe('polkadot')
    expect(collectives.version).toBe(Version.V3)
  })

  it('should throw ScenarioNotSupportedError for ParaToPara scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToPara' } as PolkadotXCMTransferInput

    expect(() => collectives.transferPolkadotXCM(invalidInput)).toThrowError(
      ScenarioNotSupportedError
    )
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for non-ParaToPara scenario', () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    collectives.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'limitedTeleportAssets', 'Unlimited')
  })

  it('should call transferRelayToPara with the correct parameters', () => {
    const expectedParameters = [{ param: 'value' }] as unknown[]
    vi.mocked(constructRelayToParaParameters).mockReturnValue(expectedParameters)

    const result = collectives.transferRelayToPara(mockOptions)

    expect(constructRelayToParaParameters).toHaveBeenCalledWith(mockOptions, Version.V3, true)
    expect(result).toEqual({
      module: 'xcmPallet',
      section: 'limitedTeleportAssets',
      parameters: expectedParameters
    })
  })
})
