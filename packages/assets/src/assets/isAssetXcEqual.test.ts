import { deepEqual } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TAssetInfo } from '../types'
import { isAssetXcEqual } from './isAssetXcEqual'

vi.mock('@paraspell/sdk-common')

describe('isAssetXcEqual', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true if locations are equal', () => {
    const a1 = { symbol: 'ABC', location: {} } as TAssetInfo
    const a2 = { symbol: 'XYZ', location: {} } as TAssetInfo
    vi.mocked(deepEqual).mockReturnValue(true)

    expect(isAssetXcEqual(a1, a2)).toBe(true)
    expect(deepEqual).toHaveBeenCalledWith(a1.location, a2.location)
  })
})
