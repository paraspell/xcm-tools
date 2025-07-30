import { getNativeAssetSymbol, type TAssetInfo } from '@paraspell/assets'
import { describe, expect, it, vi } from 'vitest'

import { isMultiHopSwap } from './isMultiHopSwap'

vi.mock('@paraspell/assets', () => ({
  getNativeAssetSymbol: vi.fn()
}))

describe('isMultiHopSwap', () => {
  const mockAssetFrom = { symbol: 'DOT' } as TAssetInfo
  const mockAssetTo = { symbol: 'USDT' } as TAssetInfo

  it('returns true for AssetHub with non-native assets', () => {
    vi.mocked(getNativeAssetSymbol).mockReturnValue('KSM')

    const result = isMultiHopSwap('AssetHubPolkadot', mockAssetFrom, mockAssetTo)

    expect(result).toBe(true)
  })

  it('returns false for non-AssetHub chains', () => {
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')

    const result = isMultiHopSwap('Acala', mockAssetFrom, mockAssetTo)

    expect(result).toBe(false)
  })

  it('returns false when assetFrom is native asset', () => {
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')

    const result = isMultiHopSwap('AssetHubPolkadot', mockAssetFrom, mockAssetTo)

    expect(result).toBe(false)
  })

  it('returns false when assetTo is native asset', () => {
    vi.mocked(getNativeAssetSymbol).mockReturnValue('USDT')

    const result = isMultiHopSwap('AssetHubPolkadot', mockAssetFrom, mockAssetTo)

    expect(result).toBe(false)
  })

  it('returns false when both assets are native', () => {
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')

    const result = isMultiHopSwap('AssetHubPolkadot', mockAssetFrom, mockAssetFrom)

    expect(result).toBe(false)
  })
})
