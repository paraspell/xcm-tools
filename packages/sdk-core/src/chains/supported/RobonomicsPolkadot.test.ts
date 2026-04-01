import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils'
import RobonomicsPolkadot from './RobonomicsPolkadot'

describe('RobonomicsPolkadot', () => {
  let chain: RobonomicsPolkadot<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    chain = getChain<unknown, unknown, unknown, 'RobonomicsPolkadot'>('RobonomicsPolkadot')
  })

  it('constructs with correct metadata', () => {
    expect(chain).toBeInstanceOf(RobonomicsPolkadot)
    expect(chain.chain).toBe('RobonomicsPolkadot')
    expect(chain.info).toBe('robonomics')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V3)
  })

  describe('transferPolkadotXCM', () => {
    it('throws ScenarioNotSupportedError', () => {
      const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<
        unknown,
        unknown,
        unknown
      >
      expect(() => chain.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
      expect(() => chain.transferPolkadotXCM(input)).toThrow(
        'Only local transfers and incoming cross-chain assets are supported.'
      )
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    const mockApi = { deserializeExtrinsics: vi.fn() } as unknown as PolkadotApi<
      unknown,
      unknown,
      unknown
    >

    it('throws when assetId is missing in assetInfo', () => {
      const bad = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n },
        recipient: 'addr'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      expect(() => chain.transferLocalNonNativeAsset(bad)).toThrow(InvalidCurrencyError)
      expect(spy).not.toHaveBeenCalled()
    })

    it('calls Assets.transfer with BigInt(assetId) & correct params', () => {
      const ok = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        recipient: 'addr123'
      } as TTransferLocalOptions<unknown, unknown, unknown>

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
        recipient: 'addr123',
        isAmountAll: true,
        keepAlive: false
      } as TTransferLocalOptions<unknown, unknown, unknown>

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
