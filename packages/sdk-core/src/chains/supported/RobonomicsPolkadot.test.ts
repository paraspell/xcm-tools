import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TScenario, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils'
import RobonomicsPolkadot from './RobonomicsPolkadot'

vi.mock('../../pallets/polkadotXcm')

describe('RobonomicsPolkadot', () => {
  let chain: RobonomicsPolkadot<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    chain = getChain<unknown, unknown, 'RobonomicsPolkadot'>('RobonomicsPolkadot')
  })

  it('constructs with correct metadata', () => {
    expect(chain).toBeInstanceOf(RobonomicsPolkadot)
    expect(chain.chain).toBe('RobonomicsPolkadot')
    expect(chain.info).toBe('robonomics')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V3)
  })

  describe('transferPolkadotXCM', () => {
    it('throws ScenarioNotSupportedError for ParaToPara', () => {
      const input = { scenario: 'ParaToPara' } as TPolkadotXCMTransferOptions<unknown, unknown>
      expect(() => chain.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
      expect(transferPolkadotXcm).not.toHaveBeenCalled()
    })

    it('uses limited_reserve_transfer_assets otherwise', async () => {
      const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<unknown, unknown>
      await chain.transferPolkadotXCM(input)
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
      const results = all.map(s => [s, chain.isReceivingTempDisabled(s)] as const)

      expect(results).toEqual([
        ['RelayToPara', false],
        ['ParaToRelay', true],
        ['ParaToPara', true]
      ])
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    const mockApi = { deserializeExtrinsics: vi.fn() } as unknown as IPolkadotApi<unknown, unknown>

    it('throws when assetId is missing in assetInfo', () => {
      const bad = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n },
        address: 'addr'
      } as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      expect(() => chain.transferLocalNonNativeAsset(bad)).toThrow(InvalidCurrencyError)
      expect(spy).not.toHaveBeenCalled()
    })

    it('calls Assets.transfer with BigInt(assetId) & correct params', () => {
      const ok = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'addr123'
      } as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(ok)

      expect(spy).toHaveBeenCalledWith({
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
      const ok = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'addr123',
        isAmountAll: true
      } as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(ok)

      expect(spy).toHaveBeenCalledWith({
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
