import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions, TXTokensTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Centrifuge from './Centrifuge'

vi.mock('../../pallets/xTokens')

describe('Centrifuge', () => {
  let centrifuge: Centrifuge<unknown, unknown>
  const mockInput = {
    asset: {
      symbol: 'CFG',
      assetId: '123',
      amount: 100n
    }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    centrifuge = getChain<unknown, unknown, 'Centrifuge'>('Centrifuge')
  })

  it('should initialize with correct values', () => {
    expect(centrifuge.chain).toBe('Centrifuge')
    expect(centrifuge.info).toBe('centrifuge')
    expect(centrifuge.ecosystem).toBe('Polkadot')
    expect(centrifuge.version).toBe(Version.V4)
  })

  it('should call transferXTokens with Native when currency matches native asset', () => {
    vi.spyOn(centrifuge, 'getNativeAssetSymbol').mockReturnValue('CFG')

    centrifuge.transferXTokens(mockInput)

    expect(transferXTokens).toHaveBeenCalledWith(mockInput, 'Native')
  })

  it('should call transferXTokens with ForeignAsset when currency does not match native asset', () => {
    vi.spyOn(centrifuge, 'getNativeAssetSymbol').mockReturnValue('NOT_CFG')

    centrifuge.transferXTokens(mockInput)

    expect(transferXTokens).toHaveBeenCalledWith(mockInput, { ForeignAsset: 123 })
  })

  describe('transferLocalNonNativeAsset', () => {
    const mockApi = {
      deserializeExtrinsics: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      centrifuge.transferLocalNonNativeAsset(mockOptions)

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
        isAmountAll: true
      } as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      centrifuge.transferLocalNonNativeAsset(mockOptions)

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
