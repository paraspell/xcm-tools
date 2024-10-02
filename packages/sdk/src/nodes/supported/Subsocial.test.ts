import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PolkadotXCMTransferInput } from '../../types'
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

describe('Robonomics', () => {
  describe('transferPolkadotXCM', () => {
    let subsocial: Subsocial

    beforeEach(() => {
      subsocial = getNode('Subsocial')
    })

    it('should be instantiated correctly', () => {
      expect(subsocial).toBeInstanceOf(Subsocial)
    })

    it('should not suppoert ParaToRelay scenario', () => {
      const input = { scenario: 'ParaToRelay' } as PolkadotXCMTransferInput
      expect(() => subsocial.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
    })

    it('should only support native currency', () => {
      const input = { scenario: 'ParaToPara', currencySymbol: 'XYZ' } as PolkadotXCMTransferInput
      expect(() => subsocial.transferPolkadotXCM(input)).toThrow(InvalidCurrencyError)
    })

    it('should use limitedReserveTransferAssets when scenario is ParaToPara', () => {
      const input = { scenario: 'ParaToPara', currencySymbol: 'SUB' } as PolkadotXCMTransferInput

      const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

      subsocial.transferPolkadotXCM(input)
      expect(spy).toHaveBeenCalledWith(input, 'limitedReserveTransferAssets', 'Unlimited')
    })
  })
})
