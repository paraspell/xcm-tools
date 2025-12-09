import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions, TXTokensTransferOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import type Zeitgeist from './Zeitgeist'

vi.mock('../../pallets/xTokens')

describe('Zeitgeist', () => {
  let zeitgeist: Zeitgeist<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'ZTG', isNative: true, amount: 100n }
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

  it('canReceiveFrom returns false for Astar and true for other chains', () => {
    expect(zeitgeist.canReceiveFrom('Astar')).toBe(false)
    expect(zeitgeist.canReceiveFrom('Acala')).toBe(true)
  })

  it('should call transferXTokens with native asset "Ztg" when currency matches native asset', () => {
    zeitgeist.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith(mockInput, 'Ztg')
  })

  it('should call transferXTokens with ForeignAsset when currency does not match the native asset', () => {
    const input = {
      ...mockInput,
      asset: { symbol: 'ACA', amount: 100n, assetId: '123' }
    } as TXTokensTransferOptions<unknown, unknown>

    zeitgeist.transferXTokens(input)

    expect(transferXTokens).toHaveBeenCalledWith(input, {
      ForeignAsset: 123
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    const mockApi = {
      deserializeExtrinsics: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    it('should throw an error when asset is not a foreign asset', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', isNative: true, amount: 100n },
        address: 'address'
      } as TTransferLocalOptions<unknown, unknown>

      expect(() => zeitgeist.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should throw an error when assetId is undefined', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n },
        address: 'address'
      } as TTransferLocalOptions<unknown, unknown>

      expect(() => zeitgeist.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as TTransferLocalOptions<unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      zeitgeist.transferLocalNonNativeAsset(mockOptions)

      expect(spy).toHaveBeenCalledWith({
        module: 'AssetManager',
        method: 'transfer',
        params: {
          dest: { Id: mockOptions.address },
          currency_id: { ForeignAsset: 1 },
          amount: BigInt(mockOptions.assetInfo.amount)
        }
      })
    })
  })
})
