import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import type { PolkadotXCMTransferInput, TRelayToParaInternalOptions } from '../../types'
import { Version } from '../../types'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import type Encointer from './Encointer'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import { getNode } from '../../utils'

vi.mock('../polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  constructRelayToParaParameters: vi.fn()
}))

describe('Encointer', () => {
  let encointer: Encointer
  const mockInput = {
    scenario: 'ParaToRelay',
    currencySymbol: 'KSM',
    amount: '100'
  } as PolkadotXCMTransferInput

  const mockOptions = {
    destination: 'Encointer'
  } as TRelayToParaInternalOptions

  beforeEach(() => {
    encointer = getNode('Encointer')
  })

  it('should initialize with correct values', () => {
    expect(encointer.node).toBe('Encointer')
    expect(encointer.name).toBe('encointer')
    expect(encointer.type).toBe('kusama')
    expect(encointer.version).toBe(Version.V3)
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for ParaToRelay scenario', () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    encointer.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'limitedTeleportAssets', 'Unlimited')
  })

  it('should throw ScenarioNotSupportedError for unsupported scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToPara' } as PolkadotXCMTransferInput
    expect(() => encointer.transferPolkadotXCM(invalidInput)).toThrowError(
      new ScenarioNotSupportedError(encointer.node, 'ParaToPara')
    )
  })

  it('should call transferRelayToPara with the correct parameters', () => {
    const expectedParameters = [{ param: 'value' }] as unknown[]
    vi.mocked(constructRelayToParaParameters).mockReturnValue(expectedParameters)

    const result = encointer.transferRelayToPara(mockOptions)

    expect(constructRelayToParaParameters).toHaveBeenCalledWith(mockOptions, Version.V1, true)
    expect(result).toEqual({
      module: 'xcmPallet',
      section: 'limitedTeleportAssets',
      parameters: expectedParameters
    })
  })
})
