import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TAsset, TNativeAsset, TNodeWithRelayChains } from '../../types'
import { Parents } from '../../types'
import { isForeignAsset } from '../../utils'
import { getAssetBySymbolOrId } from './getAssetBySymbolOrId'
import { getAssetMultiLocation } from './getAssetMultiLocation'

vi.mock('../../utils', () => ({
  isForeignAsset: vi.fn()
}))
vi.mock('./getAssetBySymbolOrId', () => ({
  getAssetBySymbolOrId: vi.fn()
}))

describe('getAssetMultiLocation', () => {
  const node: TNodeWithRelayChains = 'Acala'
  const currency = { symbol: 'ACA' }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns null if asset is not found', () => {
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(null)
    const result = getAssetMultiLocation(node, currency)
    expect(result).toBeNull()
  })

  it('returns null if asset is not a foreign asset', () => {
    const asset = { symbol: 'TEST', isNative: true } as TNativeAsset
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(asset)
    vi.mocked(isForeignAsset).mockReturnValue(false)
    const result = getAssetMultiLocation(node, currency)
    expect(result).toBeNull()
  })

  it('returns asset.multiLocation if it exists', () => {
    const multiLocation = {
      parents: Parents.ZERO,
      interior: { X2: [{ Parachain: 123 }, { Parachain: 456 }] }
    }
    const asset = { symbol: 'TEST', multiLocation }
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(asset)
    vi.mocked(isForeignAsset).mockReturnValue(true)
    const result = getAssetMultiLocation(node, currency)
    expect(result).toEqual(multiLocation)
  })

  it('returns null if multiLocation does not exists', () => {
    const asset = { symbol: 'TEST' } as TAsset
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(asset)
    vi.mocked(isForeignAsset).mockReturnValue(true)
    const result = getAssetMultiLocation(node, currency)
    expect(result).toBeNull()
  })
})
