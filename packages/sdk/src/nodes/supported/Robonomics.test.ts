import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PolkadotXCMTransferInput } from '../../types'
import { getNode } from '../../utils'
import Robonomics from './Robonomics'
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
    let robonomics: Robonomics<ApiPromise, Extrinsic>

    beforeEach(() => {
      robonomics = getNode<ApiPromise, Extrinsic, 'Robonomics'>('Robonomics')
    })

    it('should be instantiated correctly', () => {
      expect(robonomics).toBeInstanceOf(Robonomics)
    })
    it('should use limitedTeleportAssets when scenario is not ParaToPara', () => {
      const input = { scenario: 'ParaToRelay' } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

      const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

      robonomics.transferPolkadotXCM(input)
      expect(spy).toHaveBeenCalledWith(input, 'limited_reserve_transfer_assets', 'Unlimited')
    })
  })
})
