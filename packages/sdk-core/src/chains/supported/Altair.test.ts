import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions, TXTokensTransferOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import type Altair from './Altair'

vi.mock('../../pallets/xTokens')

describe('Altair', () => {
  let chain: Altair<unknown, unknown, unknown>

  const mockInput = {
    asset: { symbol: 'AIR', assetId: '1', amount: 100n }
  } as TXTokensTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'Altair'>('Altair')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Altair')
    expect(chain.info).toBe('altair')
    expect(chain.ecosystem).toBe('Kusama')
    expect(chain.version).toBe(Version.V4)
  })

  it('should call transferXTokens with Native when currency matches the native asset', () => {
    vi.spyOn(chain, 'getNativeAssetSymbol').mockReturnValue('AIR')

    chain.transferXTokens(mockInput)

    expect(transferXTokens).toHaveBeenCalledWith(mockInput, 'Native')
  })

  it('should call transferXTokens with ForeignAsset when currency does not match the native asset', () => {
    const inputWithCurrencyID = { ...mockInput, asset: { ...mockInput.asset, assetId: '1' } }
    vi.spyOn(chain, 'getNativeAssetSymbol').mockReturnValue('NOT_AIR')

    chain.transferXTokens(inputWithCurrencyID)

    expect(transferXTokens).toHaveBeenCalledWith(inputWithCurrencyID, {
      ForeignAsset: 1
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    const mockApi = {
      deserializeExtrinsics: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown, unknown>

    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(mockOptions)

      expect(spy).toHaveBeenCalledWith({
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
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address',
        isAmountAll: true,
        keepAlive: false
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(mockOptions)

      expect(spy).toHaveBeenCalledWith({
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
