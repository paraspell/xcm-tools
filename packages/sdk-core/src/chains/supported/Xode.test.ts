import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils'
import type Xode from './Xode'

vi.mock('../../pallets/polkadotXcm')

describe('Xode', () => {
  let chain: Xode<unknown, unknown, unknown>

  const mockInput = {
    scenario: 'ParaToPara',
    destChain: 'AssetHubPolkadot',
    assetInfo: { symbol: 'XYZ', location: {} }
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'Xode'>('Xode')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Xode')
    expect(chain.info).toBe('xode')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  it('should create typeAndThen call when transferPolkadotXcm is invoked', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })

  it('transferPolkadotXCM should throw ScenarioNotSupportedError for unsupported destChain', () => {
    expect(() => chain.transferPolkadotXCM({ ...mockInput, destChain: 'Darwinia' })).toThrow(
      ScenarioNotSupportedError
    )
  })

  describe('transferLocalNonNativeAsset', () => {
    const mockApi = {
      deserializeExtrinsics: vi.fn()
    } as unknown as PolkadotApi<unknown, unknown, unknown>

    it.each([
      [true, 'transfer_keep_alive'],
      [false, 'transfer']
    ])('should call Assets transfer with number id (keepAlive: %s)', (keepAlive, method) => {
      const options = {
        api: mockApi,
        assetInfo: { symbol: 'USDT', assetId: '1984', amount: 100n },
        recipient: 'address',
        keepAlive
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(options)

      expect(spy).toHaveBeenCalledWith({
        module: 'Assets',
        method,
        params: {
          id: 1984,
          target: { Id: 'address' },
          amount: 100n
        }
      })
    })

    it('should call Assets transfer_all when amount is ALL', () => {
      const options = {
        api: mockApi,
        assetInfo: { symbol: 'USDT', assetId: '1984', amount: 100n },
        recipient: 'address',
        isAmountAll: true,
        keepAlive: false
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(options)

      expect(spy).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer_all',
        params: {
          id: 1984,
          dest: { Id: 'address' },
          keep_alive: false
        }
      })
    })

    it('should throw InvalidCurrencyError when assetId is undefined', () => {
      const options = {
        api: mockApi,
        assetInfo: { symbol: 'USDT', amount: 100n },
        recipient: 'address'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      expect(() => chain.transferLocalNonNativeAsset(options)).toThrow(InvalidCurrencyError)
    })
  })
})
