import { describe, it, expect, vi, beforeEach } from 'vitest'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import type { PolkadotXCMTransferInput, TRelayToParaOptions } from '../../types'
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
  let coretimeKusama: CoretimeKusama<ApiPromise, Extrinsic>
  const mockInput = {
    scenario: 'ParaToPara',
    currencySymbol: 'KSM',
    amount: '100'
  } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

  const mockOptions = {
    destination: 'CoretimeKusama'
  } as TRelayToParaOptions<ApiPromise, Extrinsic>

  beforeEach(() => {
    coretimeKusama = getNode<ApiPromise, Extrinsic, 'CoretimeKusama'>('CoretimeKusama')
  })

  it('should initialize with correct values including assetCheckDisabled', () => {
    expect(coretimeKusama.node).toBe('CoretimeKusama')
    expect(coretimeKusama.name).toBe('kusamaCoretime')
    expect(coretimeKusama.type).toBe('kusama')
    expect(coretimeKusama.version).toBe(Version.V3)
    expect(coretimeKusama._assetCheckEnabled).toBe(false)
  })

  it('should call transferPolkadotXCM with limitedReserveTransferAssets for ParaToPara scenario', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await coretimeKusama.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'limited_reserve_transfer_assets', 'Unlimited')
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for non-ParaToPara scenario', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
    const inputWithDifferentScenario = {
      ...mockInput,
      scenario: 'RelayToPara'
    } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

    await coretimeKusama.transferPolkadotXCM(inputWithDifferentScenario)

    expect(spy).toHaveBeenCalledWith(
      inputWithDifferentScenario,
      'limited_teleport_assets',
      'Unlimited'
    )
  })

  it('should call transferRelayToPara with the correct parameters', () => {
    const expectedParameters = { param: 'value' }
    vi.mocked(constructRelayToParaParameters).mockReturnValue(expectedParameters)

    const result = coretimeKusama.transferRelayToPara(mockOptions)

    expect(constructRelayToParaParameters).toHaveBeenCalledWith(mockOptions, Version.V3, true)
    expect(result).toEqual({
      module: 'XcmPallet',
      section: 'limited_teleport_assets',
      parameters: expectedParameters
    })
  })
})
