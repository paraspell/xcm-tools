import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import RobonomicsPolkadot from './RobonomicsPolkadot'
import PolkadotXCMTransferImpl from '../polkadotXcm'

vi.mock('../polkadotXcm', async () => {
  const actual = await vi.importActual<typeof import('../polkadotXcm')>('../polkadotXcm')
  return {
    default: {
      ...actual.default,
      transferPolkadotXCM: vi.fn()
    }
  }
})

describe('RobonomicsPolkadot', () => {
  describe('transferPolkadotXCM', () => {
    let robonomics: RobonomicsPolkadot<unknown, unknown>

    beforeEach(() => {
      robonomics = getNode<unknown, unknown, 'RobonomicsPolkadot'>('RobonomicsPolkadot')
    })

    it('should be instantiated correctly', () => {
      expect(robonomics).toBeInstanceOf(RobonomicsPolkadot)
    })
    it('should use limitedTeleportAssets when scenario is not ParaToPara', async () => {
      const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<unknown, unknown>

      const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

      await robonomics.transferPolkadotXCM(input)
      expect(spy).toHaveBeenCalledWith(input, 'limited_reserve_transfer_assets', 'Unlimited')
    })
  })
})
