import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { transferXTransfer } from '../../pallets/xTransfer'
import type { TTransferLocalOptions, TXTransferTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Phala from './Phala'

vi.mock('../../pallets/xTransfer', () => ({
  transferXTransfer: vi.fn()
}))

describe('Phala', () => {
  let phala: Phala<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'PHA', amount: 100n }
  } as TXTransferTransferOptions<unknown, unknown>

  beforeEach(() => {
    phala = getChain<unknown, unknown, 'Phala'>('Phala')
  })

  it('should initialize with correct values', () => {
    expect(phala.chain).toBe('Phala')
    expect(phala.info).toBe('phala')
    expect(phala.ecosystem).toBe('Polkadot')
    expect(phala.version).toBe(Version.V3)
  })

  it('should call transferXTransfer with valid currency', () => {
    vi.spyOn(phala, 'getNativeAssetSymbol').mockReturnValue('PHA')

    phala.transferXTransfer(mockInput)

    expect(transferXTransfer).toHaveBeenCalledWith(mockInput)
  })

  it('should throw InvalidCurrencyError for unsupported currency', () => {
    vi.spyOn(phala, 'getNativeAssetSymbol').mockReturnValue('NOT_PHA')

    expect(() => phala.transferXTransfer(mockInput)).toThrow(
      new InvalidCurrencyError(`Chain Phala does not support currency PHA`)
    )
  })

  const mockApi = {
    deserializeExtrinsics: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  describe('transferLocalNonNativeAsset', () => {
    it('should throw an error when asset is not a foreign asset', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n },
        address: 'address'
      } as TTransferLocalOptions<unknown, unknown>

      expect(() => phala.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should throw an error when assetId is undefined', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n },
        address: 'address'
      } as TTransferLocalOptions<unknown, unknown>
      expect(() => phala.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      phala.transferLocalNonNativeAsset(mockOptions)

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

    it('should call transfer with balance when amount is ALL', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address',
        balance: 700n,
        isAmountAll: true
      } as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      phala.transferLocalNonNativeAsset(mockOptions)

      expect(spy).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer',
        params: {
          id: 1n,
          target: { Id: mockOptions.address },
          amount: mockOptions.balance
        }
      })
    })
  })
})
