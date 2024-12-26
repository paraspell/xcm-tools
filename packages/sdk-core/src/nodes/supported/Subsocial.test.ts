import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import Subsocial from './Subsocial'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import { InvalidCurrencyError, ScenarioNotSupportedError } from '../../errors'

vi.mock('../polkadotXcm', async () => {
  const actual = await vi.importActual<typeof import('../polkadotXcm')>('../polkadotXcm')
  return {
    default: {
      ...actual.default,
      transferPolkadotXCM: vi.fn()
    }
  }
})

describe('Subsocial', () => {
  describe('transferPolkadotXCM', () => {
    let subsocial: Subsocial<unknown, unknown>

    beforeEach(() => {
      subsocial = getNode<unknown, unknown, 'Subsocial'>('Subsocial')
    })

    it('should be instantiated correctly', () => {
      expect(subsocial).toBeInstanceOf(Subsocial)
    })

    it('should not suppoert ParaToRelay scenario', () => {
      const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<unknown, unknown>
      expect(() => subsocial.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
    })

    it('should only support native currency', () => {
      const input = {
        scenario: 'ParaToPara',
        asset: { symbol: 'XYZ' }
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      expect(() => subsocial.transferPolkadotXCM(input)).toThrow(InvalidCurrencyError)
    })

    it('should use limitedReserveTransferAssets when scenario is ParaToPara', async () => {
      const input = {
        scenario: 'ParaToPara',
        asset: { symbol: 'SUB' }
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

      await subsocial.transferPolkadotXCM(input)
      expect(spy).toHaveBeenCalledWith(input, 'limited_reserve_transfer_assets', 'Unlimited')
    })
  })
})
