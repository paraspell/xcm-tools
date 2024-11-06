import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScenarioNotSupportedError } from '../../errors'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import type { PolkadotXCMTransferInput, TRelayToParaOptions } from '../../types'
import { Version } from '../../types'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import type Collectives from './Collectives'
import { getNode } from '../../utils/getNode'
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

describe('Collectives', () => {
  let collectives: Collectives<ApiPromise, Extrinsic>
  const mockInput = {
    scenario: 'RelayToPara',
    asset: { symbol: 'DOT' },
    amount: '100'
  } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

  const mockOptions = {
    destination: 'Collectives'
  } as TRelayToParaOptions<ApiPromise, Extrinsic>

  beforeEach(() => {
    collectives = getNode<ApiPromise, Extrinsic, 'Collectives'>('Collectives')
  })

  it('should initialize with correct values', () => {
    expect(collectives.node).toBe('Collectives')
    expect(collectives.name).toBe('polkadotCollectives')
    expect(collectives.type).toBe('polkadot')
    expect(collectives.version).toBe(Version.V3)
  })

  it('should throw ScenarioNotSupportedError for ParaToPara scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToPara' } as PolkadotXCMTransferInput<
      ApiPromise,
      Extrinsic
    >

    expect(() => collectives.transferPolkadotXCM(invalidInput)).toThrowError(
      ScenarioNotSupportedError
    )
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for non-ParaToPara scenario', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await collectives.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'limited_teleport_assets', 'Unlimited')
  })

  it('should call transferRelayToPara with the correct parameters', () => {
    const expectedParameters = { param: 'value' }
    vi.mocked(constructRelayToParaParameters).mockReturnValue(expectedParameters)

    const result = collectives.transferRelayToPara(mockOptions)

    expect(constructRelayToParaParameters).toHaveBeenCalledWith(mockOptions, Version.V3, true)
    expect(result).toEqual({
      module: 'XcmPallet',
      section: 'limited_teleport_assets',
      parameters: expectedParameters
    })
  })
})
