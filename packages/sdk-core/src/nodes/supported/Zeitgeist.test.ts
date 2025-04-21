import { InvalidCurrencyError } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import XTokensTransferImpl from '../../pallets/xTokens'
import type { TTransferLocalOptions, TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils/getNode'
import type Zeitgeist from './Zeitgeist'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Zeitgeist', () => {
  let zeitgeist: Zeitgeist<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'ZTG', assetId: '123', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    zeitgeist = getNode<unknown, unknown, 'Zeitgeist'>('Zeitgeist')
  })

  it('should initialize with correct values', () => {
    expect(zeitgeist.node).toBe('Zeitgeist')
    expect(zeitgeist.info).toBe('zeitgeist')
    expect(zeitgeist.type).toBe('polkadot')
    expect(zeitgeist.version).toBe(Version.V3)
  })

  it('should call transferXTokens with native asset "Ztg" when currency matches native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(zeitgeist, 'getNativeAssetSymbol').mockReturnValue('ZTG')

    zeitgeist.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'Ztg')
  })

  it('should call transferXTokens with ForeignAsset when currency does not match the native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(zeitgeist, 'getNativeAssetSymbol').mockReturnValue('NOT_ZTG')

    zeitgeist.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, {
      ForeignAsset: 123
    })
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

      expect(() => zeitgeist.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
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

      expect(() => zeitgeist.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
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

      zeitgeist.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.callTxMethod).toHaveBeenCalledWith({
        module: 'AssetManager',
        section: 'transfer',
        parameters: {
          dest: { Id: mockOptions.address },
          currency_id: { ForeignAsset: 1 },
          amount: BigInt(mockOptions.asset.amount)
        }
      })
    })
  })
})
