import { InvalidCurrencyError } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import XTransferTransferImpl from '../../pallets/xTransfer'
import type { TTransferLocalOptions, TXTransferTransferOptions } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import type Phala from './Phala'

vi.mock('../../pallets/xTransfer', () => ({
  default: {
    transferXTransfer: vi.fn()
  }
}))

describe('Phala', () => {
  let phala: Phala<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'PHA', amount: '100' }
  } as TXTransferTransferOptions<unknown, unknown>

  beforeEach(() => {
    phala = getNode<unknown, unknown, 'Phala'>('Phala')
  })

  it('should initialize with correct values', () => {
    expect(phala.node).toBe('Phala')
    expect(phala.info).toBe('phala')
    expect(phala.type).toBe('polkadot')
    expect(phala.version).toBe(Version.V3)
  })

  it('should call transferXTransfer with valid currency', () => {
    const spy = vi.spyOn(XTransferTransferImpl, 'transferXTransfer')
    vi.spyOn(phala, 'getNativeAssetSymbol').mockReturnValue('PHA')

    phala.transferXTransfer(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput)
  })

  it('should throw InvalidCurrencyError for unsupported currency', () => {
    vi.spyOn(phala, 'getNativeAssetSymbol').mockReturnValue('NOT_PHA')

    expect(() => phala.transferXTransfer(mockInput)).toThrowError(
      new InvalidCurrencyError(`Node Phala does not support currency PHA`)
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

      expect(() => phala.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
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

      expect(() => phala.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
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

      phala.transferLocalNonNativeAsset(mockOptions)

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
