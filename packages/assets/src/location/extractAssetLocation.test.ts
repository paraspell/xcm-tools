import { Parents } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import type { TAsset } from '../types'
import { extractAssetLocation } from './extractAssetLocation'

describe('extractAssetLocation', () => {
  it('returns the Concrete property if it exists', () => {
    const ml = { parents: Parents.ONE, interior: 'Here' }
    const asset = {
      id: { Concrete: ml }
    } as TAsset
    const result = extractAssetLocation(asset)
    expect(result).toEqual(ml)
  })

  it('returns id if Concrete property does not exist', () => {
    const ml = { parents: Parents.ZERO, interior: 'Here' }
    const asset = { id: ml } as TAsset
    const result = extractAssetLocation(asset)
    expect(result).toEqual(ml)
  })
})
