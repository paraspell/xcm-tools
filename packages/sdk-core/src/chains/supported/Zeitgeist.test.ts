import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions, TXTokensTransferOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import type Zeitgeist from './Zeitgeist'

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
}))

describe('Zeitgeist', () => {
  let zeitgeist: Zeitgeist<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'ZTG', assetId: '123', amount: 100n }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    zeitgeist = getChain<unknown, unknown, 'Zeitgeist'>('Zeitgeist')
  })

  it('should initialize with correct values', () => {
    expect(zeitgeist.chain).toBe('Zeitgeist')
    expect(zeitgeist.info).toBe('zeitgeist')
    expect(zeitgeist.ecosystem).toBe('Polkadot')
    expect(zeitgeist.version).toBe(Version.V4)
  })

  it('should call transferXTokens with native asset "Ztg" when currency matches native asset', () => {
    vi.spyOn(zeitgeist, 'getNativeAssetSymbol').mockReturnValue('ZTG')

    zeitgeist.transferXTokens(mockInput)

    expect(transferXTokens).toHaveBeenCalledWith(mockInput, 'Ztg')
  })

  it('should call transferXTokens with ForeignAsset when currency does not match the native asset', () => {
    vi.spyOn(zeitgeist, 'getNativeAssetSymbol').mockReturnValue('NOT_ZTG')

    zeitgeist.transferXTokens(mockInput)

    expect(transferXTokens).toHaveBeenCalledWith(mockInput, {
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
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      zeitgeist.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.callTxMethod).toHaveBeenCalledWith({
        module: 'AssetManager',
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
