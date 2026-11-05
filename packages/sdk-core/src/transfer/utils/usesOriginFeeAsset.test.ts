import type { TAssetInfo } from '@paraspell/assets'
import { describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { usesOriginFeeAsset } from './usesOriginFeeAsset'

const dot = {
  symbol: 'DOT',
  decimals: 10,
  location: { parents: 1, interior: 'Here' }
} as TAssetInfo
const usdc = {
  symbol: 'USDC',
  decimals: 6,
  location: {
    parents: 1,
    interior: { X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 1337 }] }
  }
} as TAssetInfo
const usdt = {
  symbol: 'USDT',
  decimals: 6,
  location: {
    parents: 1,
    interior: { X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 1984 }] }
  }
} as TAssetInfo

const api = {
  findNativeAssetInfoOrThrow: vi.fn().mockReturnValue(dot)
} as unknown as PolkadotApi<unknown, unknown, unknown>

const currency = { symbol: 'USDT', amount: 1000000n }

describe('usesOriginFeeAsset', () => {
  it('returns true when the transferred asset pays the origin fee', () => {
    expect(usesOriginFeeAsset(api, 'AssetHubPolkadot', currency, usdt, usdt, usdt)).toBe(true)
  })

  it('returns false outside AssetHubPolkadot', () => {
    expect(usesOriginFeeAsset(api, 'Hydration', currency, usdt, usdt, usdt)).toBe(false)
  })

  it('returns false without a fee asset', () => {
    expect(usesOriginFeeAsset(api, 'AssetHubPolkadot', currency, usdt, undefined, dot)).toBe(false)
  })

  it('returns false when a separate fee asset pays the origin fee', () => {
    expect(usesOriginFeeAsset(api, 'AssetHubPolkadot', currency, usdt, usdc, usdc)).toBe(false)
  })

  it('returns false when the origin fee is paid in the native asset', () => {
    expect(usesOriginFeeAsset(api, 'AssetHubPolkadot', currency, usdt, usdt, dot)).toBe(false)
  })

  it('returns false when the fee asset is the native asset', () => {
    expect(usesOriginFeeAsset(api, 'AssetHubPolkadot', currency, dot, dot, dot)).toBe(false)
  })

  it('returns false for currency arrays', () => {
    expect(
      usesOriginFeeAsset(
        api,
        'AssetHubPolkadot',
        [currency, { symbol: 'USDC', amount: 1n }],
        usdt,
        usdt,
        usdt
      )
    ).toBe(false)
  })
})
