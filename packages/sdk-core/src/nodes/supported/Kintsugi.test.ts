import type { TNativeAsset, WithAmount } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferXTokens } from '../../pallets/xTokens'
import type {
  TForeignOrTokenAsset,
  TTransferLocalOptions,
  TXTokensTransferOptions
} from '../../types'
import { getNode } from '../../utils'
import type Kintsugi from './Kintsugi'

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
}))

describe('Kintsugi', () => {
  let kintsugi: Kintsugi<unknown, unknown>
  const mockInput = {
    asset: {
      symbol: 'KINT',
      assetId: '123',
      amount: 100n
    }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    kintsugi = getNode<unknown, unknown, 'Kintsugi'>('Kintsugi')
  })

  it('should initialize with correct values', () => {
    expect(kintsugi.node).toBe('Kintsugi')
    expect(kintsugi.info).toBe('kintsugi')
    expect(kintsugi.type).toBe('kusama')
    expect(kintsugi.version).toBe(Version.V3)
  })

  it('should call transferXTokens with ForeignAsset when currencyID is defined', () => {
    kintsugi.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith(mockInput, {
      ForeignAsset: 123
    } as TForeignOrTokenAsset)
  })

  it('should call transferXTokens with Token when currencyID is undefined', () => {
    const inputWithoutCurrencyID = {
      ...mockInput,
      asset: {
        symbol: 'KINT',
        amount: 100n,
        isNative: true
      } as WithAmount<TNativeAsset>
    }

    kintsugi.transferXTokens(inputWithoutCurrencyID)

    expect(transferXTokens).toHaveBeenCalledWith(inputWithoutCurrencyID, {
      Token: 'KINT'
    } as TForeignOrTokenAsset)
  })

  describe('transferLocalNativeAsset', () => {
    it('should call transferLocalNonNativeAsset', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100', assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(kintsugi, 'transferLocalNonNativeAsset')
      kintsugi.transferLocalNativeAsset(mockOptions)
      expect(spy).toHaveBeenCalledWith(mockOptions)
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      kintsugi.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.callTxMethod).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer',
        parameters: {
          dest: mockOptions.address,
          currency_id: { ForeignAsset: 1 },
          value: BigInt(mockOptions.asset.amount)
        }
      })
    })
  })
})
