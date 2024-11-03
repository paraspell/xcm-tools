import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { PolkadotXCMTransferInput, TRelayToParaOptions } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import PeopleKusama from './PeopleKusama'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'
import { ScenarioNotSupportedError } from '../../errors'

vi.mock('../../pallets/xcmPallet/utils', async () => {
  const actual = await vi.importActual<typeof import('../../pallets/xcmPallet/utils')>(
    '../../pallets/xcmPallet/utils'
  )
  return {
    ...actual,
    constructRelayToParaParameters: vi.fn().mockReturnValue('mocked_parameters')
  }
})

vi.mock('../polkadotXcm', async () => {
  const actual = await vi.importActual<typeof import('../polkadotXcm')>('../polkadotXcm')
  return {
    default: {
      ...actual.default,
      transferPolkadotXCM: vi.fn()
    }
  }
})

describe('PeopleKusama', () => {
  let peopleKusama: PeopleKusama<ApiPromise, Extrinsic>

  beforeEach(() => {
    peopleKusama = getNode<ApiPromise, Extrinsic, 'PeopleKusama'>('PeopleKusama')
  })

  it('should be instantiated correctly', () => {
    expect(peopleKusama).toBeInstanceOf(PeopleKusama)
  })

  describe('transferPolkadotXCM', () => {
    it('should throw an error when scenario is ParaToPara', () => {
      const input = { scenario: 'ParaToPara' } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

      expect(() => peopleKusama.transferPolkadotXCM(input)).toThrowError(ScenarioNotSupportedError)
    })

    it('should use limitedTeleportAssets when scenario is not ParaToPara', async () => {
      const input = { scenario: 'ParaToRelay' } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

      const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

      await peopleKusama.transferPolkadotXCM(input)
      expect(spy).toHaveBeenCalledWith(input, 'limited_teleport_assets', 'Unlimited')
    })
  })

  describe('transferRelayToPara', () => {
    it('should return correct serialized API call with default version', () => {
      const options = {} as TRelayToParaOptions<ApiPromise, Extrinsic>
      const result = peopleKusama.transferRelayToPara(options)
      expect(result).toEqual({
        module: 'XcmPallet',
        section: 'limited_teleport_assets',
        parameters: 'mocked_parameters'
      })
      expect(constructRelayToParaParameters).toHaveBeenCalledWith(options, Version.V3, true)
    })
    it('should return correct serialized API call with specified version', () => {
      const options = { version: Version.V2 } as TRelayToParaOptions<ApiPromise, Extrinsic>
      const result = peopleKusama.transferRelayToPara(options)
      expect(result).toEqual({
        module: 'XcmPallet',
        section: 'limited_teleport_assets',
        parameters: 'mocked_parameters'
      })
      expect(constructRelayToParaParameters).toHaveBeenCalledWith(options, Version.V2, true)
    })
  })
})
