import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TAssetInfo } from '../../types'
import { getNativeAssetSymbol } from '../assets'
import { Native } from '../assetSelectors'
import { findAssetInfo } from './findAssetInfo'
import { findAssetInfoOrThrow } from './findAssetInfoOrThrow'
import {
  findNativeAssetInfo,
  findNativeAssetInfoOrThrow as findNative
} from './findNativeAssetInfo'

vi.mock('../assetSelectors', () => ({
  Native: vi.fn((s: string) => ({ NATIVE: s }))
}))

vi.mock('../assets')
vi.mock('./findAssetInfo')
vi.mock('./findAssetInfoOrThrow')

describe('findNativeAssetInfo helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('findNativeAssetInfo', () => {
    it('passes plain symbol for Ethereum (does not call Native)', () => {
      const chain = 'Ethereum'
      const mockInfo = { symbol: 'ETH' } as TAssetInfo

      vi.mocked(findAssetInfo).mockReturnValue(mockInfo)
      vi.mocked(getNativeAssetSymbol).mockReturnValue('ETH')

      const res = findNativeAssetInfo(chain)

      expect(getNativeAssetSymbol).toHaveBeenCalledWith(chain)
      expect(Native).not.toHaveBeenCalled()
      expect(findAssetInfo).toHaveBeenCalledWith(chain, { symbol: 'ETH' }, null)
      expect(res).toEqual(mockInfo)
    })

    it('wraps symbol with Native() for non-Ethereum chains', () => {
      const chain = 'Polkadot'
      const mockInfo = { symbol: 'DOT' } as TAssetInfo

      vi.mocked(findAssetInfo).mockReturnValue(mockInfo)
      vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
      vi.mocked(findAssetInfo).mockReturnValue(mockInfo)

      const res = findNativeAssetInfo(chain)

      expect(getNativeAssetSymbol).toHaveBeenCalledWith(chain)
      expect(Native).toHaveBeenCalledWith('DOT')
      expect(findAssetInfo).toHaveBeenCalledWith(chain, { symbol: { NATIVE: 'DOT' } }, null)
      expect(res).toEqual(mockInfo)
    })
  })

  describe('findNativeAssetInfoOrThrow', () => {
    it('calls findAssetInfoOrThrow with correct params', () => {
      const chain = 'Polkadot'
      const mockInfo = { symbol: 'DOT' } as TAssetInfo

      vi.mocked(findAssetInfoOrThrow).mockReturnValue(mockInfo)
      vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')

      const res = findNative(chain)

      expect(getNativeAssetSymbol).toHaveBeenCalledWith(chain)
      expect(Native).toHaveBeenCalledWith('DOT')
      expect(findAssetInfoOrThrow).toHaveBeenCalledWith(chain, { symbol: { NATIVE: 'DOT' } }, null)
      expect(res).toEqual(mockInfo)
    })
  })
})
