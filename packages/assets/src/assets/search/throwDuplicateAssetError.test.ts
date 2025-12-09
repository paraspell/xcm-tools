import { describe, expect, it } from 'vitest'

import { DuplicateAssetError } from '../../errors'
import type { TAssetInfo } from '../../types'
import { throwDuplicateAssetError } from './throwDuplicateAssetError'

describe('throwDuplicateAssetError', () => {
  const symbol = 'USDT'

  it('does not throw when only one native or one foreign match exists', () => {
    expect(() =>
      throwDuplicateAssetError(symbol, [{ symbol: 'DOT', isNative: true } as TAssetInfo], [])
    ).not.toThrow()

    expect(() =>
      throwDuplicateAssetError(
        symbol,
        [],
        [{ symbol: '', alias: 'USDT1', assetId: '100' } as TAssetInfo]
      )
    ).not.toThrow()
  })

  it('throws when both native and foreign matches exist', () => {
    expect(() =>
      throwDuplicateAssetError(
        symbol,
        [{ symbol: 'DOT', isNative: true } as TAssetInfo],
        [{ symbol: 'USDT', alias: 'USDT1', assetId: '100' } as TAssetInfo]
      )
    ).toThrow(
      new DuplicateAssetError(
        `Multiple matches found for symbol ${symbol}. Please specify with Native() or Foreign() selector.`
      )
    )
  })

  it('throws with asset IDs when multiple foreign matches have assetId', () => {
    expect(() =>
      throwDuplicateAssetError(
        symbol,
        [],
        [
          { alias: 'USDT1', assetId: '100' } as TAssetInfo,
          { alias: 'USDT2', assetId: '200' } as TAssetInfo
        ]
      )
    ).toThrow(
      new DuplicateAssetError(
        `Multiple foreign assets found for symbol ${symbol}. Please specify with ForeignAbstract() selector. Available aliases: USDT1 (ID:100), USDT2 (ID:200)`
      )
    )
  })

  it('throws with Location when some foreign assets have no assetId', () => {
    expect(() =>
      throwDuplicateAssetError(
        symbol,
        [],
        [
          {
            symbol: 'USDT',
            alias: 'USDT1',
            location: { parents: 1, interior: {} }
          } as TAssetInfo,
          {
            symbol: 'USDT',
            alias: 'USDT2',
            assetId: '123'
          } as TAssetInfo
        ]
      )
    ).toThrow(
      new DuplicateAssetError(
        `Multiple foreign assets found for symbol ${symbol}. Please specify with ForeignAbstract() selector. Available aliases: USDT1 (Location:${JSON.stringify(
          {
            parents: 1,
            interior: {}
          }
        )}), USDT2 (ID:123)`
      )
    )
  })

  it('throws with only Locations if no asset has assetId', () => {
    expect(() =>
      throwDuplicateAssetError(
        symbol,
        [],
        [
          {
            symbol: 'USDT',
            alias: 'USDT1',
            location: {}
          } as TAssetInfo,
          {
            symbol: 'USDT',
            alias: 'USDT2',
            location: {}
          } as TAssetInfo
        ]
      )
    ).toThrow(
      new DuplicateAssetError(
        `Multiple foreign assets found for symbol ${symbol}. Please specify with ForeignAbstract() selector. Available aliases: USDT1 (Location:${JSON.stringify(
          {}
        )}), USDT2 (Location:${JSON.stringify({})})`
      )
    )
  })
})
