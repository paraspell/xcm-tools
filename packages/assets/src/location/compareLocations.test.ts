import type { TLocation } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import type { TAssetInfo } from '../types'
import { compareLocations } from './compareLocations'

const createAsset = (location?: TLocation): TAssetInfo =>
  ({
    symbol: 'TEST',
    decimals: 12,
    location
  }) as TAssetInfo

describe('compareLocations', () => {
  it('returns true when the JSON string matches the asset location exactly', () => {
    const location: TLocation = {
      parents: 1,
      interior: {
        X1: [
          {
            Parachain: 1000
          }
        ]
      }
    }

    const asset = createAsset(location)
    const input = JSON.stringify(location)

    expect(compareLocations(input, asset)).toBe(true)
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

    const asset = createAsset(assetLocation)
    const input = JSON.stringify(inputLocation)

    expect(compareLocations(input, asset)).toBe(true)
  })

  it('returns false when the input is not a JSON string', () => {
    const location: TLocation = {
      parents: 0,
      interior: 'Here'
    }

    const asset = createAsset(location)

    expect(compareLocations('not-json', asset)).toBe(false)
  })

  it('returns false when the asset does not have a location', () => {
    const input = JSON.stringify({ parents: 0, interior: 'Here' })

    const asset = createAsset()

    expect(compareLocations(input, asset)).toBe(false)
  })
})
