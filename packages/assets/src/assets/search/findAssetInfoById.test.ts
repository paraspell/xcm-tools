import { describe, expect, it } from 'vitest'

import { DuplicateAssetIdError } from '../../errors'
import type { TAssetInfo } from '../../types'
import { findAssetInfoById } from './findAssetInfoById'

describe('findAssetInfoById', () => {
  it('returns matching asset when a single match exists', () => {
    const assets = [{ assetId: '1', symbol: 'DOT' } as TAssetInfo]

    const result = findAssetInfoById(assets, 1)

    expect(result).toEqual(assets[0])
  })

  it('returns undefined when no match exists', () => {
    const assets = [{ assetId: '2' } as TAssetInfo]

    const result = findAssetInfoById(assets, '1')

    expect(result).toBeUndefined()
  })

  it('throws when multiple assets share the same id', () => {
    const assets = [
      { assetId: '1', symbol: 'DOT' } as TAssetInfo,
      { assetId: '1', symbol: 'DOT-duplicate' } as TAssetInfo
    ]

    expect(() => findAssetInfoById(assets, '1')).toThrow(new DuplicateAssetIdError('1'))
  })
})
