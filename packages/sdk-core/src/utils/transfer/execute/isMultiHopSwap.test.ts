import { findNativeAssetInfoOrThrow, type TAssetInfo } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isMultiHopSwap } from './isMultiHopSwap'

vi.mock('@paraspell/assets', async importOriginal => ({
  ...(await importOriginal()),
  findNativeAssetInfoOrThrow: vi.fn()
}))

describe('isMultiHopSwap', () => {
  const nativeAsset: TAssetInfo = {
    symbol: 'DOT',
    decimals: 10,
    existentialDeposit: '1',
    location: { parents: 1, interior: { Here: null } }
  }

  const foreignDot: TAssetInfo = {
    symbol: 'DOT',
    decimals: 10,
    existentialDeposit: '1',
    location: {
      parents: 1,
      interior: { X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 3 }] }
    }
  }

  const usdt: TAssetInfo = {
    symbol: 'USDT',
    decimals: 6,
    existentialDeposit: '1',
    location: {
      parents: 1,
      interior: { X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 1984 }] }
    }
  }

  beforeEach(() => {
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue(nativeAsset)
  })

  it('returns true for AssetHub with non-native assets', () => {
    expect(isMultiHopSwap('AssetHubPolkadot', foreignDot, usdt)).toBe(true)
  })

  it('returns false for non-AssetHub chains', () => {
    expect(isMultiHopSwap('Acala', foreignDot, usdt)).toBe(false)
  })

  it('returns false when assetFrom is native asset', () => {
    expect(isMultiHopSwap('AssetHubPolkadot', nativeAsset, usdt)).toBe(false)
  })

  it('returns false when assetTo is native asset', () => {
    expect(isMultiHopSwap('AssetHubPolkadot', usdt, nativeAsset)).toBe(false)
  })

  it('returns false when both assets are native', () => {
    expect(isMultiHopSwap('AssetHubPolkadot', nativeAsset, nativeAsset)).toBe(false)
  })
})
