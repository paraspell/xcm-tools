import { Parents } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import type { TMultiAsset } from '../types'
import { extractMultiAssetLoc } from './extractMultiAssetLoc'

describe('extractMultiAssetLoc', () => {
  it('returns the Concrete property if it exists', () => {
    const ml = { parents: Parents.ONE, interior: 'Here' }
    const multiAsset = {
      id: { Concrete: ml }
    } as TMultiAsset
    const result = extractMultiAssetLoc(multiAsset)
    expect(result).toEqual(ml)
  })

  it('returns id if Concrete property does not exist', () => {
    const ml = { parents: Parents.ZERO, interior: 'Here' }
    const multiAsset = { id: ml } as TMultiAsset
    const result = extractMultiAssetLoc(multiAsset)
    expect(result).toEqual(ml)
  })
})
