import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions, TXTokensTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type BifrostKusama from './BifrostKusama'

vi.mock('../../pallets/xTokens')

describe('BifrostKusama', () => {
  let bifrostKusama: BifrostKusama<unknown, unknown>

  const mockInput = {
    asset: { symbol: 'BNC', amount: 100n }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    bifrostKusama = getChain<unknown, unknown, 'BifrostKusama'>('BifrostKusama')
  })

  it('should initialize with correct values', () => {
    expect(bifrostKusama.chain).toBe('BifrostKusama')
    expect(bifrostKusama.info).toBe('bifrost')
    expect(bifrostKusama.ecosystem).toBe('Kusama')
    expect(bifrostKusama.version).toBe(Version.V5)
  })

  it('should call transferXTokens with Native when currency matches native asset', () => {
    vi.spyOn(bifrostKusama, 'getNativeAssetSymbol').mockReturnValue('BNC')

    bifrostKusama.transferXTokens(mockInput)

    expect(transferXTokens).toHaveBeenCalledWith(mockInput, { Native: 'BNC' })
  })

  it('should call transferXTokens with Token when currency does not match native asset', () => {
    vi.spyOn(bifrostKusama, 'getNativeAssetSymbol').mockReturnValue('NOT_BNC')

    bifrostKusama.transferXTokens(mockInput)

    expect(transferXTokens).toHaveBeenCalledWith(mockInput, { Native: 'BNC' })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      bifrostKusama.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer',
        params: {
          dest: { Id: mockOptions.address },
          currency_id: { Token2: 1 },
          amount: BigInt(mockOptions.assetInfo.amount)
        }
      })
    })
  })
})
