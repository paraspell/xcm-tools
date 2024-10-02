import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScenarioNotSupportedError } from '../../errors'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import { PolkadotXCMTransferInput, TRelayToParaInternalOptions, Version } from '../../types'
import BridgeHubPolkadot from './BridgeHubPolkadot'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import { getNode } from '../../utils'

vi.mock('../polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  constructRelayToParaParameters: vi.fn()
}))

describe('BridgeHubPolkadot', () => {
  let bridgeHubPolkadot: BridgeHubPolkadot
  const mockInput = {
    scenario: 'RelayToPara',
    currencySymbol: 'DOT',
    amount: '100'
  } as PolkadotXCMTransferInput

  const mockOptions = {
    destination: 'BridgeHubPolkadot'
  } as TRelayToParaInternalOptions

  beforeEach(() => {
    bridgeHubPolkadot = getNode('BridgeHubPolkadot')
  })

  it('should initialize with correct values', () => {
    expect(bridgeHubPolkadot.node).toBe('BridgeHubPolkadot')
    expect(bridgeHubPolkadot.name).toBe('polkadotBridgeHub')
    expect(bridgeHubPolkadot.type).toBe('polkadot')
    expect(bridgeHubPolkadot.version).toBe(Version.V3)
    expect(bridgeHubPolkadot._assetCheckEnabled).toBe(false)
  })

  it('should throw ScenarioNotSupportedError for ParaToPara scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToPara' } as PolkadotXCMTransferInput

    expect(() => bridgeHubPolkadot.transferPolkadotXCM(invalidInput)).toThrowError(
      new ScenarioNotSupportedError(
        bridgeHubPolkadot.node,
        'ParaToPara',
        'Unable to use bridge hub for transfers to other Parachains. Please move your currency to AssetHub to transfer to other Parachains.'
      )
    )
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for non-ParaToPara scenario', () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    bridgeHubPolkadot.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'limitedTeleportAssets', 'Unlimited')
  })

  it('should call transferRelayToPara with the correct parameters', () => {
    const expectedParameters = [{ param: 'value' }] as unknown[]
    vi.mocked(constructRelayToParaParameters).mockReturnValue(expectedParameters)

    const result = bridgeHubPolkadot.transferRelayToPara(mockOptions)

    expect(constructRelayToParaParameters).toHaveBeenCalledWith(mockOptions, Version.V3, true)
    expect(result).toEqual({
      module: 'xcmPallet',
      section: 'limitedTeleportAssets',
      parameters: expectedParameters
    })
  })
})
