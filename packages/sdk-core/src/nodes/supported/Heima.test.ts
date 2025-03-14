import { InvalidCurrencyError } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import { type TPolkadotXCMTransferOptions, Version } from '../../types'
import { getNode } from '../../utils'
import Heima from './Heima'

vi.mock('../../pallets/polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

describe('Heima', () => {
  describe('transferPolkadotXCM', () => {
    let heima: Heima<unknown, unknown>

    beforeEach(() => {
      heima = getNode<unknown, unknown, 'Heima'>('Heima')
    })

    it('should be instantiated correctly', () => {
      expect(heima).toBeInstanceOf(Heima)
    })

    it('should initialize with correct values', () => {
      expect(heima.node).toBe('Heima')
      expect(heima.info).toBe('litentry')
      expect(heima.type).toBe('polkadot')
      expect(heima.version).toBe(Version.V3)
    })

    it('should not suppoert ParaToRelay scenario', () => {
      const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<unknown, unknown>
      expect(() => heima.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
    })

    it('should only support native currency', () => {
      const input = {
        scenario: 'ParaToPara',
        asset: { symbol: 'XYZ' }
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      expect(() => heima.transferPolkadotXCM(input)).toThrow(InvalidCurrencyError)
    })

    it('should use limitedReserveTransferAssets when scenario is ParaToPara', async () => {
      const input = {
        scenario: 'ParaToPara',
        asset: { symbol: 'HEI' }
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

      await heima.transferPolkadotXCM(input)
      expect(spy).toHaveBeenCalledWith(input, 'limited_reserve_transfer_assets', 'Unlimited')
    })
  })
})
