import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import RobonomicsKusama from './RobonomicsKusama'
import PolkadotXCMTransferImpl from '../polkadotXcm'
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

describe('Robonomics', () => {
  describe('transferPolkadotXCM', () => {
    let robonomics: RobonomicsKusama<ApiPromise, Extrinsic>

    beforeEach(() => {
      robonomics = getNode<ApiPromise, Extrinsic, 'RobonomicsKusama'>('RobonomicsKusama')
    })

    it('should be instantiated correctly', () => {
      expect(robonomics).toBeInstanceOf(RobonomicsKusama)
    })
    it('should use limitedTeleportAssets when scenario is not ParaToPara', async () => {
      const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<
        ApiPromise,
        Extrinsic
      >

      const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

      await robonomics.transferPolkadotXCM(input)
      expect(spy).toHaveBeenCalledWith(input, 'limited_reserve_transfer_assets', 'Unlimited')
    })
  })
})
