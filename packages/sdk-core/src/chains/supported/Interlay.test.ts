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
import type Interlay from './Interlay'

vi.mock('../../pallets/xTokens')

describe('Interlay', () => {
  let interlay: Interlay<unknown, unknown>
  const mockInput = {
    asset: {
      symbol: 'INTR',
      assetId: '456',
      amount: 100n
    }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    interlay = getChain<unknown, unknown, 'Interlay'>('Interlay')
  })

  it('should initialize with correct values', () => {
    expect(interlay.chain).toBe('Interlay')
    expect(interlay.info).toBe('interlay')
    expect(interlay.ecosystem).toBe('Polkadot')
    expect(interlay.version).toBe(Version.V3)
  })

  it('should call transferXTokens with ForeignAsset when currencyID is defined', () => {
    interlay.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith(mockInput, {
      ForeignAsset: 456
    } as TForeignOrTokenAsset)
  })

  it('should call transferXTokens with Token when currencyID is undefined', () => {
    const inputWithoutCurrencyID = {
      ...mockInput,
      asset: {
        symbol: 'INTR',
        amount: 100n,
        isNative: true
      } as WithAmount<TNativeAssetInfo>
    }

    interlay.transferXTokens(inputWithoutCurrencyID)

    expect(transferXTokens).toHaveBeenCalledWith(inputWithoutCurrencyID, {
      Token: 'INTR'
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

      const spy = vi.spyOn(interlay, 'transferLocalNonNativeAsset')
      await interlay.transferLocalNativeAsset(mockOptions)
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

      interlay.transferLocalNonNativeAsset(mockOptions)

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

      interlay.transferLocalNonNativeAsset(mockOptions)

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
