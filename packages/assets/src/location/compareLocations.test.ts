import type { TLocation } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import type { TAssetInfo } from '../types'
import { compareLocations } from './compareLocations'

describe('compareLocations', () => {
  const dotAsset: TAssetInfo = {
    symbol: 'DOT',
    decimals: 10,
    location: { parents: 1, interior: 'Here' }
  }

  it('returns true when the JSON string matches the asset location exactly', () => {
    const input = JSON.stringify(dotAsset.location)
    expect(compareLocations(input, dotAsset)).toBe(true)
  })

  it('matches locations when numeric strings contain commas in the asset data', () => {
    const assetLocation: TLocation = {
      parents: 1,
      interior: {
        X3: [{ Parachain: '1000' }, { PalletInstance: '50' }, { GeneralIndex: '1,984' }]
      }
    }

    const inputLocation: TLocation = {
      parents: 1,
      interior: {
        X3: [{ Parachain: '1000' }, { PalletInstance: '50' }, { GeneralIndex: '1984' }]
      }
    }

    const asset = {
      ...dotAsset,
      location: assetLocation
    }
    const input = JSON.stringify(inputLocation)

    expect(compareLocations(input, asset)).toBe(true)
  })

  it('returns false when the input is not a JSON string', () => {
    const location: TLocation = {
      parents: 0,
      interior: 'Here'
    }

    const asset = {
      ...dotAsset,
      location
    }

    expect(compareLocations('not-json', asset)).toBe(false)
  })
})
