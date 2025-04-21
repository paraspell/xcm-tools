import { InvalidCurrencyError } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import XTokensTransferImpl from '../../pallets/xTokens'
import type { TTransferLocalOptions, TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import type Manta from './Manta'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Manta', () => {
  let manta: Manta<unknown, unknown>
  const mockInput = {
    asset: { assetId: '123', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    manta = getNode<unknown, unknown, 'Manta'>('Manta')
  })

  it('should initialize with correct values', () => {
    expect(manta.node).toBe('Manta')
    expect(manta.info).toBe('manta')
    expect(manta.type).toBe('polkadot')
    expect(manta.version).toBe(Version.V3)
  })

  it('should call transferXTokens with MantaCurrency selection', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    manta.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { MantaCurrency: 123n })
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
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    manta.transferXTokens({
      asset: { symbol: 'MANTA' }
    } as TXTokensTransferOptions<unknown, unknown>)

    expect(spy).toHaveBeenCalledWith(
      {
        asset: { symbol: 'MANTA' }
      },
      { MantaCurrency: 1n }
    )
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

      expect(() => manta.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
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

      expect(() => manta.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100', assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      manta.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.callTxMethod).toHaveBeenCalledWith({
        module: 'Assets',
        section: 'transfer',
        parameters: {
          target: { Id: mockOptions.address },
          id: 1n,
          amount: BigInt(mockOptions.asset.amount)
        }
      })
    })
  })
})
