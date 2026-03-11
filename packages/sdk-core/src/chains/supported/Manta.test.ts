import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions, TXTokensTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Manta from './Manta'

vi.mock('../../pallets/xTokens')

describe('Manta', () => {
  let chain: Manta<unknown, unknown, unknown>

  const mockInput = {
    asset: { assetId: '123', amount: 100n }
  } as TXTokensTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'Manta'>('Manta')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Manta')
    expect(chain.info).toBe('manta')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V3)
  })

  it('should call transferXTokens with MantaCurrency selection', () => {
    chain.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith(mockInput, { MantaCurrency: 123n })
  })

  it('should throw error for unsupported asset', () => {
    const unsupportedInput = {
      asset: { symbol: 'unsupported' }
    } as TXTokensTransferOptions<unknown, unknown, unknown>

    expect(() => chain.transferXTokens(unsupportedInput)).toThrow(InvalidCurrencyError)
  })

  it('should throw error for asset without assetId', () => {
    const unsupportedInput = {
      asset: { symbol: 'unsupported', assetId: undefined }
    } as TXTokensTransferOptions<unknown, unknown, unknown>

    expect(() => chain.transferXTokens(unsupportedInput)).toThrow(InvalidCurrencyError)
  })

  it('should call transferXTokens with native asset', () => {
    chain.transferXTokens({
      asset: { symbol: 'MANTA' }
    } as TXTokensTransferOptions<unknown, unknown, unknown>)

    expect(transferXTokens).toHaveBeenCalledWith(
      {
        asset: { symbol: 'MANTA' }
      },
      { MantaCurrency: 1n }
    )
  })

  describe('transferLocalNonNativeAsset', () => {
    const mockApi = {
      deserializeExtrinsics: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown, unknown>

    it('should throw an error when asset is not a foreign asset', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n },
        address: 'address'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      expect(() => chain.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should throw an error when assetId is undefined', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n },
        address: 'address'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      expect(() => chain.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(mockOptions)

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
        balance: 500n,
        isAmountAll: true
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(mockOptions)

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
