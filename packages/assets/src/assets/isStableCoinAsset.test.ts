import { Parents, type TLocation } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { STABLECOIN_IDS } from '../consts/consts'
import type { TAssetInfo } from '../types'
import { isStableCoinAsset } from './isStableCoinAsset'

describe('isStableCoinAsset', () => {
  const stableLocation = (id: number): TLocation => ({
    parents: Parents.ZERO,
    interior: {
      X2: [{ PalletInstance: 50 }, { GeneralIndex: id }]
    }
  })

  it('returns true for a stablecoin multilocation (PI 50 + stable index)', () => {
    const asset: TAssetInfo = {
      symbol: 'TEST',
      decimals: 12,
      location: stableLocation(STABLECOIN_IDS[0])
    }

    expect(isStableCoinAsset(asset)).toBe(true)
    expect(isStableCoinAsset(asset, STABLECOIN_IDS[0])).toBe(true)
  })

  it('returns false when PalletInstance is not 50', () => {
    const asset: TAssetInfo = {
      symbol: 'TEST',
      decimals: 12,
      location: {
        parents: Parents.ZERO,
        interior: {
          X2: [{ PalletInstance: 99 }, { GeneralIndex: STABLECOIN_IDS[0] }]
        }
      }
    }

    expect(isStableCoinAsset(asset)).toBe(false)
  })

  it('returns false when location is missing', () => {
    const asset: TAssetInfo = {
      symbol: 'TEST',
      decimals: 12
    }

    expect(isStableCoinAsset(asset)).toBe(false)
  })
})
