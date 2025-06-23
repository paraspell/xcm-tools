import { getNativeAssetSymbol, type TAsset } from '@paraspell/assets'
import type { TNodePolkadotKusama } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { isMultiHopSwap } from './isMultiHopSwap'

vi.mock('@paraspell/assets', () => ({
  getNativeAssetSymbol: vi.fn()
}))

describe('isMultiHopSwap', () => {
  const mockAssetFrom: TAsset = { symbol: 'DOT' } as TAsset
  const mockAssetTo: TAsset = { symbol: 'USDT' } as TAsset

  it('returns true for AssetHub with non-native assets', () => {
    vi.mocked(getNativeAssetSymbol).mockReturnValue('KSM')

    const result = isMultiHopSwap('AssetHub' as TNodePolkadotKusama, mockAssetFrom, mockAssetTo)

    expect(result).toBe(true)
  })

  it('returns false for non-AssetHub chains', () => {
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')

    const result = isMultiHopSwap('Polkadot' as TNodePolkadotKusama, mockAssetFrom, mockAssetTo)

    expect(result).toBe(false)
  })

  it('returns false when assetFrom is native asset', () => {
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')

    const result = isMultiHopSwap('AssetHub' as TNodePolkadotKusama, mockAssetFrom, mockAssetTo)

    expect(result).toBe(false)
  })

  it('returns false when assetTo is native asset', () => {
    vi.mocked(getNativeAssetSymbol).mockReturnValue('USDT')

    const result = isMultiHopSwap('AssetHub' as TNodePolkadotKusama, mockAssetFrom, mockAssetTo)

    expect(result).toBe(false)
  })

  it('returns false when both assets are native', () => {
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')

    const result = isMultiHopSwap('AssetHub' as TNodePolkadotKusama, mockAssetFrom, mockAssetFrom)

    expect(result).toBe(false)
  })
})
