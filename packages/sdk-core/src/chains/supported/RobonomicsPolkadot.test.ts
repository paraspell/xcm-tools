import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AMOUNT_ALL } from '../../constants'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TScenario, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils'
import RobonomicsPolkadot from './RobonomicsPolkadot'

vi.mock('../../pallets/polkadotXcm')

describe('RobonomicsPolkadot', () => {
  let robonomics: RobonomicsPolkadot<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    robonomics = getChain<unknown, unknown, 'RobonomicsPolkadot'>('RobonomicsPolkadot')
  })

  it('constructs with correct metadata', () => {
    expect(robonomics).toBeInstanceOf(RobonomicsPolkadot)
    expect(robonomics.chain).toBe('RobonomicsPolkadot')
    expect(robonomics.info).toBe('robonomics')
    expect(robonomics.ecosystem).toBe('Polkadot')
    expect(robonomics.version).toBe(Version.V3)
  })

  describe('transferPolkadotXCM', () => {
    it('throws ScenarioNotSupportedError for ParaToPara', () => {
      const input = { scenario: 'ParaToPara' } as TPolkadotXCMTransferOptions<unknown, unknown>
      expect(() => robonomics.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
      expect(transferPolkadotXcm).not.toHaveBeenCalled()
    })

    it('uses limited_reserve_transfer_assets otherwise', async () => {
      const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<unknown, unknown>
      await robonomics.transferPolkadotXCM(input)
      expect(transferPolkadotXcm).toHaveBeenCalledWith(
        input,
        'limited_reserve_transfer_assets',
        'Unlimited'
      )
    })
  })

  describe('isReceivingTempDisabled', () => {
    it('returns false only for RelayToPara; true for other scenarios', () => {
      const all: TScenario[] = ['RelayToPara', 'ParaToRelay', 'ParaToPara']
      const results = all.map(s => [s, robonomics.isReceivingTempDisabled(s)] as const)

      expect(results).toEqual([
        ['RelayToPara', false],
        ['ParaToRelay', true],
        ['ParaToPara', true]
      ])
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('throws when options are missing assetInfo (undefined)', () => {
      const mockApi = { deserializeExtrinsics: vi.fn() }
      const bad: unknown = {
        api: mockApi,
        address: 'addr'
      }

      expect(() =>
        robonomics.transferLocalNonNativeAsset(bad as TTransferLocalOptions<unknown, unknown>)
      ).toThrow(InvalidCurrencyError)
      expect(mockApi.deserializeExtrinsics).not.toHaveBeenCalled()
    })

    it('throws when assetId is missing in assetInfo', () => {
      const mockApi = { deserializeExtrinsics: vi.fn() }
      const bad = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n },
        address: 'addr'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      expect(() => robonomics.transferLocalNonNativeAsset(bad)).toThrow(InvalidCurrencyError)
      expect(mockApi.deserializeExtrinsics).not.toHaveBeenCalled()
    })

    it('calls Assets.transfer with BigInt(assetId) & correct params', () => {
      const mockApi = { deserializeExtrinsics: vi.fn() }
      const ok = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'addr123'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      robonomics.transferLocalNonNativeAsset(ok)

      expect(mockApi.deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer',
        params: {
          id: 1n,
          target: { Id: 'addr123' },
          amount: 100n
        }
      })
    })

    it('calls Assets.transfer_all when amount is ALL', () => {
      const mockApi = { deserializeExtrinsics: vi.fn() }
      const ok = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: AMOUNT_ALL, assetId: '1' },
        address: 'addr123',
        isAmountAll: true
      } as unknown as TTransferLocalOptions<unknown, unknown>

      robonomics.transferLocalNonNativeAsset(ok)

      expect(mockApi.deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer_all',
        params: {
          id: 1n,
          dest: { Id: 'addr123' },
          keep_alive: false
        }
      })
    })
  })
})
