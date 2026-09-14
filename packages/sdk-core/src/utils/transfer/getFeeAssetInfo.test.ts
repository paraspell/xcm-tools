import { isAssetEqual, type TAssetInfo } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getFeeAssetInfo } from './getFeeAssetInfo'

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
