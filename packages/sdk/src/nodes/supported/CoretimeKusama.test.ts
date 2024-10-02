import { describe, it, expect, vi, beforeEach } from 'vitest'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import { PolkadotXCMTransferInput, TRelayToParaInternalOptions, Version } from '../../types'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import CoretimeKusama from './CoretimeKusama'
import { getNode } from '../../utils'

vi.mock('../polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  constructRelayToParaParameters: vi.fn()
}))

describe('CoretimeKusama', () => {
  let coretimeKusama: CoretimeKusama
  const mockInput = {
    scenario: 'ParaToPara',
    currencySymbol: 'KSM',
    amount: '100'
  } as PolkadotXCMTransferInput

  const mockOptions = {
    destination: 'CoretimeKusama'
  } as TRelayToParaInternalOptions

  beforeEach(() => {
    coretimeKusama = getNode('CoretimeKusama')
  })

  it('should initialize with correct values including assetCheckDisabled', () => {
    expect(coretimeKusama.node).toBe('CoretimeKusama')
    expect(coretimeKusama.name).toBe('kusamaCoretime')
    expect(coretimeKusama.type).toBe('kusama')
    expect(coretimeKusama.version).toBe(Version.V3)
    expect(coretimeKusama._assetCheckEnabled).toBe(false)
  })

  it('should call transferPolkadotXCM with limitedReserveTransferAssets for ParaToPara scenario', () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    coretimeKusama.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'limitedReserveTransferAssets', 'Unlimited')
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for non-ParaToPara scenario', () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
    const inputWithDifferentScenario = {
      ...mockInput,
      scenario: 'RelayToPara'
    } as PolkadotXCMTransferInput

    coretimeKusama.transferPolkadotXCM(inputWithDifferentScenario)

    expect(spy).toHaveBeenCalledWith(
      inputWithDifferentScenario,
      'limitedTeleportAssets',
      'Unlimited'
    )
  })

  it('should call transferRelayToPara with the correct parameters', () => {
    const expectedParameters = [{ param: 'value' }] as unknown[]
    vi.mocked(constructRelayToParaParameters).mockReturnValue(expectedParameters)

    const result = coretimeKusama.transferRelayToPara(mockOptions)

    expect(constructRelayToParaParameters).toHaveBeenCalledWith(mockOptions, Version.V3, true)
    expect(result).toEqual({
      module: 'xcmPallet',
      section: 'limitedTeleportAssets',
      parameters: expectedParameters
    })
  })
})
