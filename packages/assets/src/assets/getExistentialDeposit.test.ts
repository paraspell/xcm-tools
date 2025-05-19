import type { TNodeWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TAsset, TCurrencyCore, TNodeAssets } from '../types'
import { getAssetsObject } from './assets'
import { getExistentialDeposit } from './getExistentialDeposit'
import { findAssetForNodeOrThrow } from './search'

vi.mock('./assets', () => ({
  getAssetsObject: vi.fn()
}))

vi.mock('./search', () => ({
  findAssetForNodeOrThrow: vi.fn()
}))

describe('getExistentialDeposit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return the ED of the first native asset if currency is not provided', () => {
    const node: TNodeWithRelayChains = 'Acala'
    const ed = '1000000000'

    vi.mocked(getAssetsObject).mockReturnValue({
      nativeAssets: [{ symbol: 'ACA', existentialDeposit: ed }],
      otherAssets: []
    } as unknown as TNodeAssets)

    const result = getExistentialDeposit(node)
    expect(result).toBe(ed)
  })

  it('should return null if currency is not provided and native asset has no ED', () => {
    const node: TNodeWithRelayChains = 'Acala'

    vi.mocked(getAssetsObject).mockReturnValue({
      nativeAssets: [{ symbol: 'ACA' }],
      otherAssets: []
    } as unknown as TNodeAssets)

    const result = getExistentialDeposit(node)
    expect(result).toBeNull()
  })

  it('should return the ED of the foreign asset if currency is provided and asset is found', () => {
    const node: TNodeWithRelayChains = 'Karura'
    const currency: TCurrencyCore = { symbol: 'KSM' }
    const ed = '500000000'

    vi.mocked(getAssetsObject).mockReturnValue({
      nativeAssets: [{ symbol: 'KAR', existentialDeposit: '1000000000' }],
      otherAssets: []
    } as unknown as TNodeAssets)

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({
      symbol: 'KSM',
      assetId: '1',
      existentialDeposit: ed
    })

    const result = getExistentialDeposit(node, currency)
    expect(result).toBe(ed)
  })

  it('should return null if currency is provided, asset is found, but no ED is present', () => {
    const node: TNodeWithRelayChains = 'Karura'
    const currency: TCurrencyCore = { symbol: 'KSM' }

    vi.mocked(getAssetsObject).mockReturnValue({
      nativeAssets: [{ symbol: 'KAR', existentialDeposit: '1000000000' }],
      otherAssets: []
    } as unknown as TNodeAssets)

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({
      symbol: 'KSM'
    } as TAsset)

    const result = getExistentialDeposit(node, currency)
    expect(result).toBeNull()
  })
})
