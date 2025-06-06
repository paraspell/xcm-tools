import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import type CoretimeKusama from './CoretimeKusama'

vi.mock('../../pallets/polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  constructRelayToParaParameters: vi.fn()
}))

describe('CoretimeKusama', () => {
  let node: CoretimeKusama<unknown, unknown>
  const mockInput = {
    scenario: 'ParaToPara',
    asset: { symbol: 'KSM', amount: '100' }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    node = getNode<unknown, unknown, 'CoretimeKusama'>('CoretimeKusama')
  })

  it('should initialize with correct values', () => {
    expect(node.node).toBe('CoretimeKusama')
    expect(node.info).toBe('kusamaCoretime')
    expect(node.type).toBe('kusama')
    expect(node.version).toBe(Version.V4)
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
    } as TPolkadotXCMTransferOptions<unknown, unknown>

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
      method: 'limited_teleport_assets',
      includeFee: true
    })
  })
})
