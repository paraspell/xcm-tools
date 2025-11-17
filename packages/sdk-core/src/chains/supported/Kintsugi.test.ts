import type { TNativeAssetInfo, WithAmount } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AMOUNT_ALL } from '../../constants'
import { transferXTokens } from '../../pallets/xTokens'
import type {
  TForeignOrTokenAsset,
  TTransferLocalOptions,
  TXTokensTransferOptions
} from '../../types'
import { getChain } from '../../utils'
import type Kintsugi from './Kintsugi'

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
}))

describe('Kintsugi', () => {
  let kintsugi: Kintsugi<unknown, unknown>
  const mockInput = {
    asset: {
      symbol: 'KINT',
      assetId: '123',
      amount: 100n
    }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    kintsugi = getChain<unknown, unknown, 'Kintsugi'>('Kintsugi')
  })

  it('should initialize with correct values', () => {
    expect(kintsugi.chain).toBe('Kintsugi')
    expect(kintsugi.info).toBe('kintsugi')
    expect(kintsugi.ecosystem).toBe('Kusama')
    expect(kintsugi.version).toBe(Version.V3)
  })

  it('should call transferXTokens with ForeignAsset when currencyID is defined', () => {
    kintsugi.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith(mockInput, {
      ForeignAsset: 123
    } as TForeignOrTokenAsset)
  })

  it('should call transferXTokens with Token when currencyID is undefined', () => {
    const inputWithoutCurrencyID = {
      ...mockInput,
      asset: {
        symbol: 'KINT',
        amount: 100n,
        isNative: true
      } as WithAmount<TNativeAssetInfo>
    }

    kintsugi.transferXTokens(inputWithoutCurrencyID)

    expect(transferXTokens).toHaveBeenCalledWith(inputWithoutCurrencyID, {
      Token: 'KINT'
    } as TForeignOrTokenAsset)
  })

  describe('transferLocalNativeAsset', () => {
    it('should call transferLocalNonNativeAsset', async () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: '100', assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(kintsugi, 'transferLocalNonNativeAsset')
      await kintsugi.transferLocalNativeAsset(mockOptions)
      expect(spy).toHaveBeenCalledWith(mockOptions)
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      kintsugi.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer',
        params: {
          dest: mockOptions.address,
          currency_id: { ForeignAsset: 1 },
          value: BigInt(mockOptions.assetInfo.amount)
        }
      })
    })

    it('should call transfer_all when amount is ALL', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: AMOUNT_ALL, assetId: '1' },
        address: 'address',
        isAmountAll: true
      } as unknown as TTransferLocalOptions<unknown, unknown>

      kintsugi.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer_all',
        params: {
          dest: mockOptions.address,
          currency_id: { ForeignAsset: 1 },
          keep_alive: false
        }
      })
    })
  })
})
