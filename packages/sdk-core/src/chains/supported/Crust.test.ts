import type { TAssetInfo } from '@paraspell/assets'
import { InvalidCurrencyError, type WithAmount } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { transferXTokens } from '../../pallets/xTokens'
import type { TReserveAsset, TTransferLocalOptions, TXTokensTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Crust from './Crust'

vi.mock('../../pallets/xTokens')

describe('Crust', () => {
  let crust: Crust<unknown, unknown>
  const mockInput = {
    asset: {
      symbol: 'CRU',
      isNative: true,
      amount: 100n
    }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    crust = getChain<unknown, unknown, 'Crust'>('Crust')
  })

  it('should initialize with correct values', () => {
    expect(crust.chain).toBe('Crust')
    expect(crust.info).toBe('crustParachain')
    expect(crust.ecosystem).toBe('Polkadot')
    expect(crust.version).toBe(Version.V3)
  })

  it('should call transferXTokens with SelfReserve when currency matches native asset', () => {
    crust.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith(mockInput, 'SelfReserve' as TReserveAsset)
  })

  it('should call transferXTokens with OtherReserve when currencyID is defined and currency does not match native asset', () => {
    const input = {
      ...mockInput,
      asset: {
        symbol: 'XYZ',
        amount: 100n,
        assetId: '123'
      }
    } as TXTokensTransferOptions<unknown, unknown>

    crust.transferXTokens(input)
    expect(transferXTokens).toHaveBeenCalledWith(input, { OtherReserve: 123n } as TReserveAsset)
  })

  it('should throw InvalidCurrencyError when currencyID is undefined and currency does not match native asset', () => {
    const invalidInput = {
      ...mockInput,
      asset: {
        symbol: 'XYZ',
        amount: 100n
      } as WithAmount<TAssetInfo>
    }

    expect(() => crust.transferXTokens(invalidInput)).toThrow(InvalidCurrencyError)
  })

  describe('transferLocalNonNativeAsset', () => {
    const mockApi = {
      deserializeExtrinsics: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    it('should throw an error when asset is not a foreign asset', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n },
        address: 'address'
      } as TTransferLocalOptions<unknown, unknown>

      expect(() => crust.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should throw an error when assetId is undefined', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n },
        address: 'address'
      } as TTransferLocalOptions<unknown, unknown>

      expect(() => crust.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      crust.transferLocalNonNativeAsset(mockOptions)

      expect(spy).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer',
        params: {
          target: { Id: mockOptions.address },
          id: 1n,
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

      crust.transferLocalNonNativeAsset(mockOptions)

      expect(spy).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer_all',
        params: {
          dest: { Id: mockOptions.address },
          id: 1n,
          keep_alive: false
        }
      })
    })
  })
})
