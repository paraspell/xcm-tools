import type { TChain } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { findAssetInfo } from './findAssetInfo'

// Regression guard for the real asset registry (no mocks): trust-backed assets that squat an
// Asset Hub's native symbol must not be listed, otherwise a plain { symbol } lookup collides with
// the native asset and throws DuplicateAssetError.
describe('findAssetInfo - native symbol on Asset Hubs', () => {
  const cases: [TChain, string][] = [
    ['AssetHubPolkadot', 'DOT'],
    ['AssetHubKusama', 'KSM'],
    ['AssetHubWestend', 'WND'],
    ['AssetHubPaseo', 'PAS']
  ]

  for (const [chain, symbol] of cases) {
    it(`resolves plain ${symbol} on ${chain} to the native asset`, () => {
      const asset = findAssetInfo(chain, { symbol }, null)
      expect(asset?.isNative).toBe(true)
    })
  }
})
