import { InvalidCurrencyError } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import Subsocial from './Subsocial'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

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

      await subsocial.transferPolkadotXCM(input)
      expect(transferPolkadotXcm).toHaveBeenCalledWith(
        input,
        'limited_reserve_transfer_assets',
        'Unlimited'
      )
    })
  })
})
