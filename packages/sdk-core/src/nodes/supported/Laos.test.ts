import { InvalidCurrencyError } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  NodeNotSupportedError,
  ScenarioNotSupportedError,
  TransferToAhNotSupported
} from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import Laos from './Laos'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

describe('Laos', () => {
  describe('transferPolkadotXCM', () => {
    let laos: Laos<unknown, unknown>

    beforeEach(() => {
      laos = getNode<unknown, unknown, 'Laos'>('Laos')
    })

    it('should be instantiated correctly', () => {
      expect(laos).toBeInstanceOf(Laos)
    })

    it('should not suppoert ParaToRelay scenario', () => {
      const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<unknown, unknown>
      expect(() => laos.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
    })

    it('should only support native currency', () => {
      const input = {
        scenario: 'ParaToPara',
        asset: { symbol: 'XYZ' }
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      expect(() => laos.transferPolkadotXCM(input)).toThrow(InvalidCurrencyError)
    })

    it('should use limitedReserveTransferAssets when scenario is ParaToPara', async () => {
      const input = {
        scenario: 'ParaToPara',
        asset: { symbol: 'LAOS' }
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      await laos.transferPolkadotXCM(input)
      expect(transferPolkadotXcm).toHaveBeenCalledWith(
        input,
        'limited_reserve_transfer_assets',
        'Unlimited'
      )
    })

    it('should not support transfer to AssetHubPolkadot', () => {
      const input = {
        scenario: 'ParaToPara',
        asset: { symbol: 'LAOS' },
        destination: 'AssetHubPolkadot'
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      expect(() => laos.transferPolkadotXCM(input)).toThrowError(TransferToAhNotSupported)
    })

    it('should throw NodeNotSupportedError for transferRelayToPara', () => {
      expect(() => laos.transferRelayToPara()).toThrowError(NodeNotSupportedError)
    })
  })
})
