import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import CoretimePolkadot from './CoretimePolkadot'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

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
  let node: CoretimePolkadot<ApiPromise, Extrinsic>

  beforeEach(() => {
    node = getNode<ApiPromise, Extrinsic, 'CoretimePolkadot'>('CoretimePolkadot')
  })

  it('should be instantiated correctly', () => {
    expect(node).toBeInstanceOf(CoretimePolkadot)
  })

  describe('transferPolkadotXCM', () => {
    it('should use limitedReserveTransferAssets when scenario is ParaToPara', async () => {
      const input = { scenario: 'ParaToPara' } as TPolkadotXCMTransferOptions<ApiPromise, Extrinsic>

      const mockResult = {} as Extrinsic

      const spy = vi
        .spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
        .mockResolvedValue(mockResult)

      await node.transferPolkadotXCM(input)

      expect(spy).toHaveBeenCalledWith(input, 'limited_reserve_transfer_assets', 'Unlimited')
    })

    it('should use limitedTeleportAssets when scenario is not ParaToPara', async () => {
      const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<
        ApiPromise,
        Extrinsic
      >

      const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

      await node.transferPolkadotXCM(input)
      expect(spy).toHaveBeenCalledWith(input, 'limited_teleport_assets', 'Unlimited')
    })
  })

  it('should call getRelayToParaOverrides with the correct parameters', () => {
    const result = node.getRelayToParaOverrides()

    expect(result).toEqual({
      section: 'limited_teleport_assets',
      includeFee: true
    })
  })
})
