import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type CoretimeKusama from './CoretimeKusama'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  constructRelayToParaParameters: vi.fn()
}))

describe('CoretimeKusama', () => {
  let chain: CoretimeKusama<unknown, unknown>
  const mockInput = {
    scenario: 'ParaToPara',
    assetInfo: { symbol: 'KSM', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'CoretimeKusama'>('CoretimeKusama')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('CoretimeKusama')
    expect(chain.info).toBe('kusamaCoretime')
    expect(chain.type).toBe('kusama')
    expect(chain.version).toBe(Version.V5)
  })

  it('should call transferPolkadotXCM with limitedReserveTransferAssets for ParaToPara scenario', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      mockInput,
      'limited_reserve_transfer_assets',
      'Unlimited'
    )
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for non-ParaToPara scenario', async () => {
    const inputWithDifferentScenario = {
      ...mockInput,
      scenario: 'RelayToPara'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await chain.transferPolkadotXCM(inputWithDifferentScenario)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      inputWithDifferentScenario,
      'limited_teleport_assets',
      'Unlimited'
    )
  })

  it('should call getRelayToParaOverrides with the correct parameters', () => {
    const result = chain.getRelayToParaOverrides()

    expect(result).toEqual({
      method: 'limited_teleport_assets',
      includeFee: true
    })
  })
})
