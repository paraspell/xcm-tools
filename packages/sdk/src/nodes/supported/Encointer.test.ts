import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import type { PolkadotXCMTransferInput, TRelayToParaOptions } from '../../types'
import { Version } from '../../types'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import type Encointer from './Encointer'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
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

describe('Encointer', () => {
  let encointer: Encointer<ApiPromise, Extrinsic>
  const mockInput = {
    scenario: 'ParaToRelay',
    asset: { symbol: 'KSM' },
    amount: '100'
  } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

  const mockOptions = {
    destination: 'Encointer'
  } as TRelayToParaOptions<ApiPromise, Extrinsic>

  beforeEach(() => {
    encointer = getNode<ApiPromise, Extrinsic, 'Encointer'>('Encointer')
  })

  it('should initialize with correct values', () => {
    expect(encointer.node).toBe('Encointer')
    expect(encointer.info).toBe('encointer')
    expect(encointer.type).toBe('kusama')
    expect(encointer.version).toBe(Version.V3)
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for ParaToRelay scenario', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await encointer.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'limited_teleport_assets', 'Unlimited')
  })

  it('should throw ScenarioNotSupportedError for unsupported scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToPara' } as PolkadotXCMTransferInput<
      ApiPromise,
      Extrinsic
    >
    expect(() => encointer.transferPolkadotXCM(invalidInput)).toThrowError(
      new ScenarioNotSupportedError(encointer.node, 'ParaToPara')
    )
  })

  it('should call transferRelayToPara with the correct parameters', () => {
    const expectedParameters = { param: 'value' }
    vi.mocked(constructRelayToParaParameters).mockReturnValue(expectedParameters)

    const result = encointer.transferRelayToPara(mockOptions)

    expect(constructRelayToParaParameters).toHaveBeenCalledWith(mockOptions, Version.V1, true)
    expect(result).toEqual({
      module: 'XcmPallet',
      section: 'limited_teleport_assets',
      parameters: expectedParameters
    })
  })
})
