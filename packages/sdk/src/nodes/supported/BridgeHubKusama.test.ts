import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScenarioNotSupportedError } from '../../errors'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import type { PolkadotXCMTransferInput, TRelayToParaOptions } from '../../types'
import { Version } from '../../types'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import type BridgeHubKusama from './BridgeHubKusama'
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

describe('BridgeHubKusama', () => {
  let bridgeHubKusama: BridgeHubKusama<ApiPromise, Extrinsic>
  const mockInput = {
    scenario: 'RelayToPara',
    asset: { symbol: 'KSM' },
    amount: '100'
  } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

  const mockOptions = {
    destination: 'BridgeHubKusama'
  } as TRelayToParaOptions<ApiPromise, Extrinsic>

  beforeEach(() => {
    bridgeHubKusama = getNode<ApiPromise, Extrinsic, 'BridgeHubKusama'>('BridgeHubKusama')
  })

  it('should initialize with correct values', () => {
    expect(bridgeHubKusama.node).toBe('BridgeHubKusama')
    expect(bridgeHubKusama.name).toBe('kusamaBridgeHub')
    expect(bridgeHubKusama.type).toBe('kusama')
    expect(bridgeHubKusama.version).toBe(Version.V3)
    expect(bridgeHubKusama._assetCheckEnabled).toBe(false)
  })

  it('should throw ScenarioNotSupportedError for ParaToPara scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToPara' } as PolkadotXCMTransferInput<
      ApiPromise,
      Extrinsic
    >

    expect(() => bridgeHubKusama.transferPolkadotXCM(invalidInput)).toThrowError(
      new ScenarioNotSupportedError(
        bridgeHubKusama.node,
        'ParaToPara',
        'Unable to use bridge hub for transfers to other Parachains. Please move your currency to AssetHub to transfer to other Parachains.'
      )
    )
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for non-ParaToPara scenario', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await bridgeHubKusama.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'limited_teleport_assets', 'Unlimited')
  })

  it('should call transferRelayToPara with the correct parameters', () => {
    const expectedParameters = { param: 'value' }
    vi.mocked(constructRelayToParaParameters).mockReturnValue(expectedParameters)

    const result = bridgeHubKusama.transferRelayToPara(mockOptions)

    expect(constructRelayToParaParameters).toHaveBeenCalledWith(mockOptions, Version.V3, true)
    expect(result).toEqual({
      module: 'XcmPallet',
      section: 'limited_teleport_assets',
      parameters: expectedParameters
    })
  })
})
