import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Version, type TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import { InvalidCurrencyError, ScenarioNotSupportedError } from '../../errors'
import Litentry from './Litentry'

vi.mock('../../pallets/polkadotXcm', async () => {
  const actual = await vi.importActual<typeof import('../../pallets/polkadotXcm')>(
    '../../pallets/polkadotXcm'
  )
  return {
    default: {
      ...actual.default,
      transferPolkadotXCM: vi.fn()
    }
  }
})

describe('Litentry', () => {
  describe('transferPolkadotXCM', () => {
    let litentry: Litentry<unknown, unknown>

    beforeEach(() => {
      litentry = getNode<unknown, unknown, 'Litentry'>('Litentry')
    })

    it('should be instantiated correctly', () => {
      expect(litentry).toBeInstanceOf(Litentry)
    })

    it('should initialize with correct values', () => {
      expect(litentry.node).toBe('Litentry')
      expect(litentry.info).toBe('litentry')
      expect(litentry.type).toBe('polkadot')
      expect(litentry.version).toBe(Version.V3)
    })

    it('should not suppoert ParaToRelay scenario', () => {
      const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<unknown, unknown>
      expect(() => litentry.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
    })

    it('should only support native currency', () => {
      const input = {
        scenario: 'ParaToPara',
        asset: { symbol: 'XYZ' }
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      expect(() => litentry.transferPolkadotXCM(input)).toThrow(InvalidCurrencyError)
    })

    it('should use limitedReserveTransferAssets when scenario is ParaToPara', async () => {
      const input = {
        scenario: 'ParaToPara',
        asset: { symbol: 'LIT' }
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

      await litentry.transferPolkadotXCM(input)
      expect(spy).toHaveBeenCalledWith(input, 'limited_reserve_transfer_assets', 'Unlimited')
    })
  })
})
