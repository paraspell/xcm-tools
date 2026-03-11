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
})
