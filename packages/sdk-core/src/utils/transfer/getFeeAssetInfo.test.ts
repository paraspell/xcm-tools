import { isAssetEqual, type TAssetInfo } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { getFeeAssetInfo, hasMatchingFeeAssetReserve } from './getFeeAssetInfo'

vi.mock('@paraspell/assets')

describe('getFeeAssetInfo', () => {
  const assetInfo = {
    symbol: 'USDT',
    location: { parents: 1, interior: { Here: null } }
  } as TAssetInfo
  const feeAssetInfo = {
    symbol: 'DOT',
    location: { parents: 1, interior: { X1: { Parachain: 1000 } } }
  } as TAssetInfo

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns undefined when no fee asset is provided', () => {
    expect(getFeeAssetInfo(assetInfo)).toBeUndefined()
    expect(isAssetEqual).not.toHaveBeenCalled()
  })

  it('returns undefined when the fee asset equals the transferred asset', () => {
    vi.mocked(isAssetEqual).mockReturnValue(true)
    expect(getFeeAssetInfo(assetInfo, feeAssetInfo)).toBeUndefined()
  })

  it('returns the fee asset when it differs from the transferred asset', () => {
    vi.mocked(isAssetEqual).mockReturnValue(false)
    expect(getFeeAssetInfo(assetInfo, feeAssetInfo)).toBe(feeAssetInfo)
  })
})

describe('hasMatchingFeeAssetReserve', () => {
  const assetInfo = {
    symbol: 'DOT',
    location: { parents: 1, interior: { Here: null } }
  } as TAssetInfo
  const feeAssetInfo = {
    symbol: 'USDT',
    location: { parents: 0, interior: { X1: { GeneralIndex: 1984 } } }
  } as TAssetInfo

  const createApi = (reserves: Record<string, string>) =>
    ({
      getAssetReserveChain: vi.fn((_chain, location) => reserves[JSON.stringify(location)])
    }) as unknown as PolkadotApi<unknown, unknown, unknown>

  it('returns true when the fee asset equals the transferred asset', () => {
    vi.mocked(isAssetEqual).mockReturnValue(true)
    const api = createApi({})
    expect(hasMatchingFeeAssetReserve(api, 'AssetHubPolkadot', assetInfo, assetInfo)).toBe(true)
  })

  it('compares the reserve chains of the fee asset and the transferred asset', () => {
    vi.mocked(isAssetEqual).mockReturnValue(false)
    const same = createApi({
      [JSON.stringify(assetInfo.location)]: 'AssetHubPolkadot',
      [JSON.stringify(feeAssetInfo.location)]: 'AssetHubPolkadot'
    })
    expect(hasMatchingFeeAssetReserve(same, 'AssetHubPolkadot', assetInfo, feeAssetInfo)).toBe(true)

    const different = createApi({
      [JSON.stringify(assetInfo.location)]: 'AssetHubPolkadot',
      [JSON.stringify(feeAssetInfo.location)]: 'BifrostPolkadot'
    })
    expect(hasMatchingFeeAssetReserve(different, 'Hydration', assetInfo, feeAssetInfo)).toBe(false)
  })
})
