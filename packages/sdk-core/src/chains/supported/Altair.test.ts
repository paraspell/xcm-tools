import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AMOUNT_ALL } from '../../constants'
import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions, TXTokensTransferOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import type Altair from './Altair'

vi.mock('../../pallets/xTokens')

describe('Altair', () => {
  let altair: Altair<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'AIR', assetId: '1', amount: 100n }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    altair = getChain<unknown, unknown, 'Altair'>('Altair')
  })

  it('should initialize with correct values', () => {
    expect(altair.chain).toBe('Altair')
    expect(altair.info).toBe('altair')
    expect(altair.ecosystem).toBe('Kusama')
    expect(altair.version).toBe(Version.V4)
  })

  it('should call transferXTokens with Native when currency matches the native asset', () => {
    vi.spyOn(altair, 'getNativeAssetSymbol').mockReturnValue('AIR')

    altair.transferXTokens(mockInput)

    expect(transferXTokens).toHaveBeenCalledWith(mockInput, 'Native')
  })

  it('should call transferXTokens with ForeignAsset when currency does not match the native asset', () => {
    const inputWithCurrencyID = { ...mockInput, asset: { ...mockInput.asset, assetId: '1' } }
    vi.spyOn(altair, 'getNativeAssetSymbol').mockReturnValue('NOT_AIR')

    altair.transferXTokens(inputWithCurrencyID)

    expect(transferXTokens).toHaveBeenCalledWith(inputWithCurrencyID, {
      ForeignAsset: 1
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

      altair.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer',
        params: {
          dest: { Id: mockOptions.address },
          currency_id: { ForeignAsset: 1 },
          amount: BigInt(mockOptions.assetInfo.amount)
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

      altair.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer_all',
        params: {
          dest: { Id: mockOptions.address },
          currency_id: { ForeignAsset: 1 },
          keep_alive: false
        }
      })
    })
  })
})
