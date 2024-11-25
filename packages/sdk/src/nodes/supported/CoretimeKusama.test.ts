import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { Version } from '../../types'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import type CoretimeKusama from './CoretimeKusama'
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

describe('CoretimeKusama', () => {
  let node: CoretimeKusama<ApiPromise, Extrinsic>
  const mockInput = {
    scenario: 'ParaToPara',
    asset: { symbol: 'KSM' },
    amount: '100'
  } as TPolkadotXCMTransferOptions<ApiPromise, Extrinsic>

  beforeEach(() => {
    node = getNode<ApiPromise, Extrinsic, 'CoretimeKusama'>('CoretimeKusama')
  })

  it('should initialize with correct values including assetCheckDisabled', () => {
    expect(node.node).toBe('CoretimeKusama')
    expect(node.info).toBe('kusamaCoretime')
    expect(node.type).toBe('kusama')
    expect(node.version).toBe(Version.V3)
    expect(node._assetCheckEnabled).toBe(false)
  })

  it('should call transferPolkadotXCM with limitedReserveTransferAssets for ParaToPara scenario', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await node.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'limited_reserve_transfer_assets', 'Unlimited')
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for non-ParaToPara scenario', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
    const inputWithDifferentScenario = {
      ...mockInput,
      scenario: 'RelayToPara'
    } as TPolkadotXCMTransferOptions<ApiPromise, Extrinsic>

    await node.transferPolkadotXCM(inputWithDifferentScenario)

    expect(spy).toHaveBeenCalledWith(
      inputWithDifferentScenario,
      'limited_teleport_assets',
      'Unlimited'
    )
  })

  it('should call getRelayToParaOverrides with the correct parameters', () => {
    const result = node.getRelayToParaOverrides()

    expect(result).toEqual({
      section: 'limited_teleport_assets',
      includeFee: true
    })
  })
})
