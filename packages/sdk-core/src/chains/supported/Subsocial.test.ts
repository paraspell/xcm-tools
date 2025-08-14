import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Subsocial from './Subsocial'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

describe('Subsocial', () => {
  describe('transferPolkadotXCM', () => {
    let subsocial: Subsocial<unknown, unknown>

    beforeEach(() => {
      subsocial = getChain<unknown, unknown, 'Subsocial'>('Subsocial')
    })

    it('should initialize with correct values', () => {
      expect(subsocial.chain).toBe('Subsocial')
      expect(subsocial.info).toBe('subsocial')
      expect(subsocial.ecosystem).toBe('Polkadot')
      expect(subsocial.version).toBe(Version.V3)
    })

    it('should not suppoert ParaToRelay scenario', () => {
      const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<unknown, unknown>
      expect(() => subsocial.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
    })

    it('should only support native currency', () => {
      const input = {
        scenario: 'ParaToPara',
        assetInfo: { symbol: 'XYZ' }
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      expect(() => subsocial.transferPolkadotXCM(input)).toThrow(InvalidCurrencyError)
    })

    it('should use limitedReserveTransferAssets when scenario is ParaToPara', async () => {
      const input = {
        scenario: 'ParaToPara',
        assetInfo: { symbol: 'SUB' }
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
