import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScenarioNotSupportedError } from '../../errors'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import type { PolkadotXCMTransferInput, TRelayToParaOptions } from '../../types'
import { Version } from '../../types'
import type BridgeHubPolkadot from './BridgeHubPolkadot'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  constructRelayToParaParameters: vi.fn()
}))

describe('BridgeHubPolkadot', () => {
  let bridgeHubPolkadot: BridgeHubPolkadot<ApiPromise, Extrinsic>
  const mockInput = {
    scenario: 'RelayToPara',
    asset: { symbol: 'DOT' },
    amount: '100'
  } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

  const mockOptions = {
    destination: 'BridgeHubPolkadot'
  } as TRelayToParaOptions<ApiPromise, Extrinsic>

  beforeEach(() => {
    bridgeHubPolkadot = getNode<ApiPromise, Extrinsic, 'BridgeHubPolkadot'>('BridgeHubPolkadot')
  })

  it('should initialize with correct values', () => {
    expect(bridgeHubPolkadot.node).toBe('BridgeHubPolkadot')
    expect(bridgeHubPolkadot.info).toBe('polkadotBridgeHub')
    expect(bridgeHubPolkadot.type).toBe('polkadot')
    expect(bridgeHubPolkadot.version).toBe(Version.V3)
    expect(bridgeHubPolkadot._assetCheckEnabled).toBe(false)
  })

  it('should throw ScenarioNotSupportedError for ParaToPara scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToPara' } as PolkadotXCMTransferInput<
      ApiPromise,
      Extrinsic
    >

    expect(() => bridgeHubPolkadot.transferPolkadotXCM(invalidInput)).toThrowError(
      new ScenarioNotSupportedError(
        bridgeHubPolkadot.node,
        'ParaToPara',
        'Unable to use bridge hub for transfers to other Parachains. Please move your currency to AssetHub to transfer to other Parachains.'
      )
    )
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for non-ParaToPara scenario', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await bridgeHubPolkadot.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'limited_teleport_assets', 'Unlimited')
  })

  it('should call transferRelayToPara with the correct parameters', () => {
    const expectedParameters = { param: 'value' }
    vi.mocked(constructRelayToParaParameters).mockReturnValue(expectedParameters)

    const result = bridgeHubPolkadot.transferRelayToPara(mockOptions)

    expect(constructRelayToParaParameters).toHaveBeenCalledWith(mockOptions, Version.V3, true)
    expect(result).toEqual({
      module: 'XcmPallet',
      section: 'limited_teleport_assets',
      parameters: expectedParameters
    })
  })
})
