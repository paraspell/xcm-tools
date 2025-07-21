import type { TAsset, TMultiAsset } from '@paraspell/assets'
import { findAssetForNodeOrThrow, isForeignAsset, isSymbolMatch } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferXTokens } from '../../pallets/xTokens'
import type { TXTokensTransferOptions } from '../../types'
import { assertHasId, assertHasLocation, createMultiAsset } from '../../utils'
import { getNode } from '../../utils/getNode'
import type Jamton from './Jamton'

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  InvalidCurrencyError: class InvalidCurrencyError extends Error {},
  findAssetForNodeOrThrow: vi.fn(),
  isForeignAsset: vi.fn(),
  isSymbolMatch: vi.fn()
}))

vi.mock('../../utils', () => ({
  assertHasLocation: vi.fn(),
  assertHasId: vi.fn(),
  createMultiAsset: vi.fn()
}))

describe('Jamton', () => {
  let jamton: Jamton<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    jamton = getNode<unknown, unknown, 'Jamton'>('Jamton')
  })

  describe('initialization', () => {
    it('should initialize with correct values', () => {
      expect(jamton.node).toBe('Jamton')
      expect(jamton.info).toBe('jamton')
      expect(jamton.type).toBe('polkadot')
      expect(jamton.version).toBe(Version.V4)
    })
  })

  describe('transferXTokens', () => {
    const baseInput = {
      asset: {},
      scenario: 'ParaToPara' as const,
      destination: 'AssetHubPolkadot' as const,
      version: Version.V4
    } as TXTokensTransferOptions<unknown, unknown>

    it('should handle DOTON native asset', () => {
      const input = {
        ...baseInput,
        asset: { symbol: 'DOTON', amount: 100n }
      } as TXTokensTransferOptions<unknown, unknown>

      vi.mocked(isForeignAsset).mockReturnValue(false)

      jamton.transferXTokens(input)

      expect(transferXTokens).toHaveBeenCalledWith(input, { Native: 0 })
    })

    it('should handle stDOT native asset', () => {
      const input = {
        ...baseInput,
        asset: { symbol: 'stDOT', amount: 100n }
      } as TXTokensTransferOptions<unknown, unknown>

      vi.mocked(isForeignAsset).mockReturnValue(false)

      jamton.transferXTokens(input)

      expect(transferXTokens).toHaveBeenCalledWith(input, { Native: 1 })
    })

    it('should handle jamTON native asset', () => {
      const input = {
        ...baseInput,
        asset: { symbol: 'jamTON', amount: 100n }
      } as TXTokensTransferOptions<unknown, unknown>

      vi.mocked(isForeignAsset).mockReturnValue(false)

      jamton.transferXTokens(input)

      expect(transferXTokens).toHaveBeenCalledWith(input, { Native: 2 })
    })

    it('should handle foreign asset with assetId', () => {
      const input = {
        ...baseInput,
        asset: { symbol: 'USDT', assetId: '123', amount: 100n }
      }
      vi.mocked(isForeignAsset).mockReturnValue(true)
      vi.mocked(isSymbolMatch).mockReturnValue(false)

      jamton.transferXTokens(input)

      expect(assertHasId).toHaveBeenCalledWith(input.asset)
      expect(assertHasId).toHaveBeenCalledTimes(1)

      expect(transferXTokens).toHaveBeenCalledWith(input, { ForeignAsset: 123 })
    })

    it('should NOT call assertHasId for native assets', () => {
      const input = {
        ...baseInput,
        asset: { symbol: 'DOTON', amount: 100n }
      } as TXTokensTransferOptions<unknown, unknown>

      vi.mocked(isForeignAsset).mockReturnValue(false)

      jamton.transferXTokens(input)

      expect(assertHasId).not.toHaveBeenCalled()
      expect(transferXTokens).toHaveBeenCalledWith(input, { Native: 0 })
    })

    describe('scenario validation', () => {
      it('should throw ScenarioNotSupportedError for ParaToPara to non-AssetHubPolkadot', () => {
        const input = {
          ...baseInput,
          asset: { symbol: 'USDT', assetId: '123', amount: 100n },
          scenario: 'ParaToPara' as const,
          destination: 'Acala' as const
        }
        vi.mocked(isForeignAsset).mockReturnValue(true)
        vi.mocked(isSymbolMatch).mockReturnValue(false)

        expect(() => jamton.transferXTokens(input)).toThrow(ScenarioNotSupportedError)
        expect(() => jamton.transferXTokens(input)).toThrow(
          'Transfer from Jamton to "Acala" is not yet supported'
        )
      })

      it('should allow ParaToPara to AssetHubPolkadot', () => {
        const input = {
          ...baseInput,
          asset: { symbol: 'USDT', assetId: '123', amount: 100n },
          scenario: 'ParaToPara' as const,
          destination: 'AssetHubPolkadot' as const
        }
        vi.mocked(isForeignAsset).mockReturnValue(true)
        vi.mocked(isSymbolMatch).mockReturnValue(false)

        jamton.transferXTokens(input)

        expect(transferXTokens).toHaveBeenCalledWith(input, { ForeignAsset: 123 })
      })

      it('should allow non-ParaToPara scenarios to any destination', () => {
        const input = {
          ...baseInput,
          asset: { symbol: 'USDT', assetId: '123', amount: 100n },
          scenario: 'ParaToRelay' as const,
          destination: 'Acala' as const
        }
        vi.mocked(isForeignAsset).mockReturnValue(true)
        vi.mocked(isSymbolMatch).mockReturnValue(false)

        jamton.transferXTokens(input)

        expect(transferXTokens).toHaveBeenCalledWith(input, { ForeignAsset: 123 })
      })
    })

    describe('WUD special case', () => {
      it('should handle WUD symbol with multi-asset transfer', () => {
        const mockUsdtAsset = {
          symbol: 'USDt',
          multiLocation: {}
        } as TAsset

        const input = {
          ...baseInput,
          asset: {
            symbol: 'WUD',
            assetId: '456',
            amount: 1000n,
            multiLocation: {}
          }
        } as TXTokensTransferOptions<unknown, unknown>

        vi.mocked(isForeignAsset).mockReturnValue(true)
        vi.mocked(isSymbolMatch).mockReturnValue(true)
        vi.mocked(findAssetForNodeOrThrow).mockReturnValue(mockUsdtAsset)
        vi.mocked(createMultiAsset)
          .mockReturnValueOnce({
            mockMultiAsset: 'usdt',
            isFeeAsset: true
          } as unknown as TMultiAsset)
          .mockReturnValueOnce({ mockMultiAsset: 'wud' } as unknown as TMultiAsset)

        jamton.transferXTokens(input)

        expect(isSymbolMatch).toHaveBeenCalledWith('WUD', 'WUD')
        expect(findAssetForNodeOrThrow).toHaveBeenCalledWith('Jamton', { symbol: 'USDt' }, null)
        expect(assertHasLocation).toHaveBeenCalledWith(input.asset)
        expect(assertHasLocation).toHaveBeenCalledWith(mockUsdtAsset)
        expect(createMultiAsset).toHaveBeenCalledWith(
          Version.V4,
          180_000n,
          mockUsdtAsset.multiLocation
        )
        expect(createMultiAsset).toHaveBeenCalledWith(Version.V4, 1000n, input.asset.multiLocation)

        expect(transferXTokens).toHaveBeenCalledWith(
          {
            ...input,
            overriddenAsset: [
              { mockMultiAsset: 'usdt', isFeeAsset: true },
              { mockMultiAsset: 'wud' }
            ]
          },
          '456'
        )
      })

      it('should not treat non-WUD symbols as WUD', () => {
        const input = {
          ...baseInput,
          asset: { symbol: 'USDT', assetId: '123', amount: 100n }
        }
        vi.mocked(isForeignAsset).mockReturnValue(true)
        vi.mocked(isSymbolMatch).mockReturnValue(false)

        jamton.transferXTokens(input)

        expect(findAssetForNodeOrThrow).not.toHaveBeenCalled()
        expect(transferXTokens).toHaveBeenCalledWith(input, { ForeignAsset: 123 })
      })
    })

    describe('edge cases', () => {
      it('should handle string assetId conversion to number', () => {
        const input = {
          ...baseInput,
          asset: { symbol: 'USDT', assetId: '999', amount: 100n }
        }
        vi.mocked(isForeignAsset).mockReturnValue(true)
        vi.mocked(isSymbolMatch).mockReturnValue(false)

        jamton.transferXTokens(input)

        expect(transferXTokens).toHaveBeenCalledWith(input, { ForeignAsset: 999 })
      })

      it('should handle numeric assetId', () => {
        const input = {
          ...baseInput,
          asset: { symbol: 'USDT', assetId: '777', amount: 100n }
        } as TXTokensTransferOptions<unknown, unknown>

        vi.mocked(isForeignAsset).mockReturnValue(true)
        vi.mocked(isSymbolMatch).mockReturnValue(false)

        jamton.transferXTokens(input)

        expect(transferXTokens).toHaveBeenCalledWith(input, { ForeignAsset: 777 })
      })
    })
  })
})
