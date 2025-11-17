import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AMOUNT_ALL } from '../../constants'
import { transferXTokens } from '../../pallets/xTokens'
import type {
  TSendInternalOptions,
  TTransferLocalOptions,
  TXTokensTransferOptions
} from '../../types'
import { getChain } from '../../utils'
import type Manta from './Manta'

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
}))

describe('Manta', () => {
  let manta: Manta<unknown, unknown>
  const mockInput = {
    asset: { assetId: '123', amount: 100n }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    manta = getChain<unknown, unknown, 'Manta'>('Manta')
  })

  it('should initialize with correct values', () => {
    expect(manta.chain).toBe('Manta')
    expect(manta.info).toBe('manta')
    expect(manta.ecosystem).toBe('Polkadot')
    expect(manta.version).toBe(Version.V3)
  })

  it('should call transferXTokens with MantaCurrency selection', () => {
    manta.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith(mockInput, { MantaCurrency: 123n })
  })

  it('should throw error for unsupported asset', () => {
    const unsupportedInput = {
      asset: { symbol: 'unsupported' }
    } as TXTokensTransferOptions<unknown, unknown>

    expect(() => manta.transferXTokens(unsupportedInput)).toThrow(InvalidCurrencyError)
  })

  it('should throw error for asset without assetId', () => {
    const unsupportedInput = {
      asset: { symbol: 'unsupported', assetId: undefined }
    } as TXTokensTransferOptions<unknown, unknown>

    expect(() => manta.transferXTokens(unsupportedInput)).toThrow(InvalidCurrencyError)
  })

  it('should call transferXTokens with native asset', () => {
    manta.transferXTokens({
      asset: { symbol: 'MANTA' }
    } as TXTokensTransferOptions<unknown, unknown>)

    expect(transferXTokens).toHaveBeenCalledWith(
      {
        asset: { symbol: 'MANTA' }
      },
      { MantaCurrency: 1n }
    )
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should throw an error when asset is not a foreign asset', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      expect(() => manta.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should throw an error when assetId is undefined', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      expect(() => manta.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      manta.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.deserializeExtrinsics).toHaveBeenCalledWith({
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
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: AMOUNT_ALL, assetId: '1' },
        address: 'address',
        balance: 500n,
        isAmountAll: true
      } as unknown as TTransferLocalOptions<unknown, unknown>

      manta.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.deserializeExtrinsics).toHaveBeenCalledWith({
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

  describe('temporary disablement flags', () => {
    const sendOptions = {} as unknown as TSendInternalOptions<unknown, unknown>

    it('isSendingTempDisabled should return true', () => {
      expect(manta.isSendingTempDisabled(sendOptions)).toBe(true)
    })

    it('isReceivingTempDisabled should return true', () => {
      expect(manta.isReceivingTempDisabled('ParaToPara')).toBe(true)
    })
  })
})
