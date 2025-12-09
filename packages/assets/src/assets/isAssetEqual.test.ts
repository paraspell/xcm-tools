import { deepEqual } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TAssetInfo } from '../types'
import { isAssetEqual } from './isAssetEqual'

vi.mock('@paraspell/sdk-common')
vi.mock('../guards')

describe('isAssetEqual', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true if locations are equal', () => {
    const a1 = { symbol: 'ABC', location: {} } as TAssetInfo
    const a2 = { symbol: 'XYZ', location: {} } as TAssetInfo
    vi.mocked(deepEqual).mockReturnValue(true)

    expect(isAssetEqual(a1, a2)).toBe(true)
    expect(deepEqual).toHaveBeenCalledWith(a1.location, a2.location)
  })

  it('returns true if both are foreign with same assetId', () => {
    const a1 = { symbol: 'ABC', assetId: '1' } as TAssetInfo
    const a2 = { symbol: 'DEF', assetId: '1' } as TAssetInfo

    expect(isAssetEqual(a1, a2)).toBe(true)
  })

  it('returns true if symbols match case-insensitively', () => {
    const a1 = { symbol: 'Abc' } as TAssetInfo
    const a2 = { symbol: 'abc' } as TAssetInfo

    expect(isAssetEqual(a1, a2)).toBe(true)
  })

  it('returns false if nothing matches', () => {
    const a1 = { symbol: 'Abc', assetId: '1' } as TAssetInfo
    const a2 = { symbol: 'Xyz', assetId: '2' } as TAssetInfo

    expect(isAssetEqual(a1, a2)).toBe(false)
  })
})
