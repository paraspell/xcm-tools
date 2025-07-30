import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions, TXTokensTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Centrifuge from './Centrifuge'

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
}))

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
    expect(centrifuge.type).toBe('polkadot')
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
    it('should throw an error when asset is not a foreign asset', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      expect(() => centrifuge.transferLocalNonNativeAsset(mockOptions)).toThrow(
        InvalidCurrencyError
      )
    })

    it('should throw an error when assetId is undefined', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      expect(() => centrifuge.transferLocalNonNativeAsset(mockOptions)).toThrow(
        InvalidCurrencyError
      )
    })

    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      centrifuge.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.callTxMethod).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer',
        parameters: {
          dest: { Id: mockOptions.address },
          currency_id: { ForeignAsset: 1 },
          amount: BigInt(mockOptions.assetInfo.amount)
        }
      })
    })
  })
})
