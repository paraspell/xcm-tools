import type { TMultiLocation } from '@paraspell/sdk-common'
import { Parents, type TNodeWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { findAsset } from '../assets'
import { type TAsset } from '../types'
import { getAssetMultiLocation } from './getAssetMultiLocation'

vi.mock('../assets/search', () => ({
  findAsset: vi.fn()
}))

describe('getAssetMultiLocation', () => {
  const node: TNodeWithRelayChains = 'Acala'
  const currency = { symbol: 'ACA' }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns null if asset is not found', () => {
    vi.mocked(findAsset).mockReturnValue(null)
    const result = getAssetMultiLocation(node, currency)
    expect(result).toBeNull()
  })

  it('returns asset.multiLocation if it exists', () => {
    const multiLocation = {
      parents: Parents.ZERO,
      interior: { X2: [{ Parachain: 123 }, { Parachain: 456 }] }
    } as TMultiLocation
    const asset = { symbol: 'TEST', multiLocation }
    vi.mocked(findAsset).mockReturnValue(asset)
    const result = getAssetMultiLocation(node, currency)
    expect(result).toEqual(multiLocation)
  })

  it('returns null if multiLocation does not exists', () => {
    const asset = { symbol: 'TEST' } as TAsset
    vi.mocked(findAsset).mockReturnValue(asset)
    const result = getAssetMultiLocation(node, currency)
    expect(result).toBeNull()
  })
})
