import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Extrinsic, PolkadotXCMTransferInput, TRelayToParaInternalOptions } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import CoretimePolkadot from './CoretimePolkadot'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'

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

describe('CoretimePolkadot', () => {
  let coretimePolkadot: CoretimePolkadot

  beforeEach(() => {
    coretimePolkadot = getNode('CoretimePolkadot')
  })

  it('should be instantiated correctly', () => {
    expect(coretimePolkadot).toBeInstanceOf(CoretimePolkadot)
  })

  describe('transferPolkadotXCM', () => {
    it('should use limitedReserveTransferAssets when scenario is ParaToPara', () => {
      const input = { scenario: 'ParaToPara' } as PolkadotXCMTransferInput

      const mockResult = {} as Extrinsic

      const spy = vi
        .spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
        .mockResolvedValue(mockResult)

      coretimePolkadot.transferPolkadotXCM(input)

      expect(spy).toHaveBeenCalledWith(input, 'limitedReserveTransferAssets', 'Unlimited')
    })

    it('should use limitedTeleportAssets when scenario is not ParaToPara', () => {
      const input = { scenario: 'ParaToRelay' } as PolkadotXCMTransferInput

      const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

      coretimePolkadot.transferPolkadotXCM(input)
      expect(spy).toHaveBeenCalledWith(input, 'limitedTeleportAssets', 'Unlimited')
    })
  })

  describe('transferRelayToPara', () => {
    it('should return correct serialized API call with default version', () => {
      const options = {} as TRelayToParaInternalOptions
      const result = coretimePolkadot.transferRelayToPara(options)
      expect(result).toEqual({
        module: 'xcmPallet',
        section: 'limitedTeleportAssets',
        parameters: 'mocked_parameters'
      })
      expect(constructRelayToParaParameters).toHaveBeenCalledWith(options, Version.V3, true)
    })
    it('should return correct serialized API call with specified version', () => {
      const options = { version: Version.V2 } as TRelayToParaInternalOptions
      const result = coretimePolkadot.transferRelayToPara(options)
      expect(result).toEqual({
        module: 'xcmPallet',
        section: 'limitedTeleportAssets',
        parameters: 'mocked_parameters'
      })
      expect(constructRelayToParaParameters).toHaveBeenCalledWith(options, Version.V2, true)
    })

    describe('getProvider', () => {
      it('should return the correct provider URL', () => {
        const result = coretimePolkadot.getProvider()
        expect(result).toBe('wss://polkadot-coretime-rpc.polkadot.io')
      })
    })
  })
})
