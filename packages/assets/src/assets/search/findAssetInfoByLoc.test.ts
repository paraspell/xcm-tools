import { describe, expect, it } from 'vitest'

import type { TAssetInfo } from '../../types'
import { findAssetInfoByLoc } from './findAssetInfoByLoc'

const relayNative: TAssetInfo = {
  symbol: 'DOT',
  decimals: 10,
  location: { parents: 1, interior: { Here: null } }
}

const usdt: TAssetInfo = {
  symbol: 'USDT',
  assetId: '1984',
  decimals: 6,
  location: {
    parents: 1,
    interior: {
      X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: '1,984' }]
    }
  }
}

const usdc: TAssetInfo = {
  symbol: 'USDC',
  assetId: '1337',
  decimals: 6,
  location: {
    parents: 1,
    interior: {
      X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 1337 }]
    }
  }
}

const assets = [relayNative, usdt, usdc]

describe('findAssetInfoByLoc', () => {
  it('matches the canonical { Here: null } object form', () => {
    const result = findAssetInfoByLoc(assets, {
      parents: 1,
      interior: { Here: null }
    })
    expect(result).toBe(relayNative)
  })

  it('normalizes the "Here" shorthand object form to { Here: null }', () => {
    const result = findAssetInfoByLoc(assets, {
      parents: 1,
      interior: 'Here'
    })
    expect(result).toBe(relayNative)
  })

  it('still applies comma-tolerant string comparison', () => {
    const result = findAssetInfoByLoc(
      assets,
      JSON.stringify({
        parents: 1,
        interior: {
          X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: '1984' }]
        }
      })
    )
    expect(result).toBe(usdt)
  })

  it('returns undefined when nothing matches', () => {
    const result = findAssetInfoByLoc(assets, {
      parents: 2,
      interior: 'Here'
    })
    expect(result).toBeUndefined()
  })

  it('matches bigint junction values against numeric asset locations', () => {
    const result = findAssetInfoByLoc(assets, {
      parents: 1,
      interior: {
        X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 1337n }]
      }
    })
    expect(result).toBe(usdc)
  })
})
