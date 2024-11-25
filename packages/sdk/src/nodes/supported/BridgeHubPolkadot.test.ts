import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScenarioNotSupportedError } from '../../errors'
import type { TPolkadotXCMTransferOptions } from '../../types'
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

describe('BridgeHubPolkadot', () => {
  let node: BridgeHubPolkadot<ApiPromise, Extrinsic>
  const mockInput = {
    scenario: 'RelayToPara',
    asset: { symbol: 'DOT' },
    amount: '100'
  } as TPolkadotXCMTransferOptions<ApiPromise, Extrinsic>

  beforeEach(() => {
    node = getNode<ApiPromise, Extrinsic, 'BridgeHubPolkadot'>('BridgeHubPolkadot')
  })

  it('should initialize with correct values', () => {
    expect(node.node).toBe('BridgeHubPolkadot')
    expect(node.info).toBe('polkadotBridgeHub')
    expect(node.type).toBe('polkadot')
    expect(node.version).toBe(Version.V3)
    expect(node._assetCheckEnabled).toBe(false)
  })

  it('should throw ScenarioNotSupportedError for ParaToPara scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToPara' } as TPolkadotXCMTransferOptions<
      ApiPromise,
      Extrinsic
    >

    expect(() => node.transferPolkadotXCM(invalidInput)).toThrowError(
      new ScenarioNotSupportedError(
        node.node,
        'ParaToPara',
        'Unable to use bridge hub for transfers to other Parachains. Please move your currency to AssetHub to transfer to other Parachains.'
      )
    )
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for non-ParaToPara scenario', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await node.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'limited_teleport_assets', 'Unlimited')
  })

  it('should call getRelayToParaOverrides with the correct parameters', () => {
    const result = node.getRelayToParaOverrides()

    expect(result).toEqual({
      section: 'limited_teleport_assets',
      includeFee: true
    })
  })
})
