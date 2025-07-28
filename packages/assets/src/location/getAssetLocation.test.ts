import type { TLocation } from '@paraspell/sdk-common'
import { Parents, type TNodeWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { findAssetInfo } from '../assets'
import { type TAssetInfo } from '../types'
import { getAssetLocation } from './getAssetLocation'

vi.mock('../assets/search', () => ({
  findAssetInfo: vi.fn()
}))

describe('getAssetLocation', () => {
  const node: TNodeWithRelayChains = 'Acala'
  const currency = { symbol: 'ACA' }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns null if asset is not found', () => {
    vi.mocked(findAssetInfo).mockReturnValue(null)
    const result = getAssetLocation(node, currency)
    expect(result).toBeNull()
  })

  it('returns asset.location if it exists', () => {
    const location = {
      parents: Parents.ZERO,
      interior: { X2: [{ Parachain: 123 }, { Parachain: 456 }] }
    } as TLocation
    const asset = { symbol: 'TEST', location }
    vi.mocked(findAssetInfo).mockReturnValue(asset)
    const result = getAssetLocation(node, currency)
    expect(result).toEqual(location)
  })

  it('returns null if asset location does not exists', () => {
    const asset = { symbol: 'TEST' } as TAssetInfo
    vi.mocked(findAssetInfo).mockReturnValue(asset)
    const result = getAssetLocation(node, currency)
    expect(result).toBeNull()
  })
})
