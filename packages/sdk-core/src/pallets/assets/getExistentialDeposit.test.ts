import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getExistentialDeposit } from './getExistentialDeposit'
import { InvalidCurrencyError } from '../../errors'
import { getAssetsObject } from './assets' // Adjust path accordingly
import { getAssetBySymbolOrId } from './getAssetBySymbolOrId'
import type { TNodeWithRelayChains, TCurrencyCore, TNodeAssets, TAsset } from '../../types'

vi.mock('./assets', () => ({
  getAssetsObject: vi.fn()
}))

vi.mock('./getAssetBySymbolOrId', () => ({
  getAssetBySymbolOrId: vi.fn()
}))

describe('getExistentialDeposit', () => {
  const mockedGetAssetsObject = vi.mocked(getAssetsObject)
  const mockedGetAssetBySymbolOrId = vi.mocked(getAssetBySymbolOrId)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return the ED of the first native asset if currency is not provided', () => {
    const node: TNodeWithRelayChains = 'Acala'
    const ed = '1000000000'

    mockedGetAssetsObject.mockReturnValue({
      nativeAssets: [{ symbol: 'ACA', existentialDeposit: ed }],
      otherAssets: []
    } as unknown as TNodeAssets)

    const result = getExistentialDeposit(node)
    expect(result).toBe(ed)
  })

  it('should return null if currency is not provided and native asset has no ED', () => {
    const node: TNodeWithRelayChains = 'Acala'

    mockedGetAssetsObject.mockReturnValue({
      nativeAssets: [{ symbol: 'ACA' }], // no existentialDeposit field
      otherAssets: []
    } as unknown as TNodeAssets)

    const result = getExistentialDeposit(node)
    expect(result).toBeNull()
  })

  it('should return the ED of the foreign asset if currency is provided and asset is found', () => {
    const node: TNodeWithRelayChains = 'Karura'
    const currency: TCurrencyCore = { symbol: 'KSM' }
    const ed = '500000000'

    mockedGetAssetsObject.mockReturnValue({
      nativeAssets: [{ symbol: 'KAR', existentialDeposit: '1000000000' }],
      otherAssets: []
    } as unknown as TNodeAssets)

    mockedGetAssetBySymbolOrId.mockReturnValue({
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

    mockedGetAssetsObject.mockReturnValue({
      nativeAssets: [{ symbol: 'KAR', existentialDeposit: '1000000000' }],
      otherAssets: []
    } as unknown as TNodeAssets)

    mockedGetAssetBySymbolOrId.mockReturnValue({
      symbol: 'KSM' // no existentialDeposit field
    } as TAsset)

    const result = getExistentialDeposit(node, currency)
    expect(result).toBeNull()
  })

  it('should try Ethereum if node is AssetHubPolkadot and asset not found initially', () => {
    const node: TNodeWithRelayChains = 'AssetHubPolkadot'
    const currency: TCurrencyCore = { symbol: 'DOT' }
    const ed = '750000000'

    mockedGetAssetsObject.mockReturnValue({
      nativeAssets: [{ symbol: 'ASSET', existentialDeposit: '1000000000' }],
      otherAssets: []
    } as unknown as TNodeAssets)

    // First call returns null
    mockedGetAssetBySymbolOrId.mockReturnValueOnce(null)
    // Second call (with Ethereum node) returns the asset
    mockedGetAssetBySymbolOrId.mockReturnValueOnce({
      symbol: 'DOT',
      existentialDeposit: ed
    } as TAsset)

    const result = getExistentialDeposit(node, currency)
    expect(getAssetBySymbolOrId).toHaveBeenCalledTimes(2)
    expect(result).toBe(ed)
  })

  it('should throw InvalidCurrencyError if asset not found even after checking Ethereum node for AssetHubPolkadot', () => {
    const node: TNodeWithRelayChains = 'AssetHubPolkadot'
    const currency: TCurrencyCore = { symbol: 'DOT' }

    mockedGetAssetsObject.mockReturnValue({
      nativeAssets: [{ symbol: 'ASSET', existentialDeposit: '1000000000' }],
      otherAssets: []
    } as unknown as TNodeAssets)

    mockedGetAssetBySymbolOrId
      .mockReturnValueOnce(null) // Not found in AssetHubPolkadot
      .mockReturnValueOnce(null) // Not found in Ethereum fallback

    expect(() => getExistentialDeposit(node, currency)).toThrow(InvalidCurrencyError)
  })

  it('should throw InvalidCurrencyError if asset not found in non-AssetHubPolkadot node', () => {
    const node: TNodeWithRelayChains = 'Karura'
    const currency: TCurrencyCore = { symbol: 'KSM' }

    mockedGetAssetsObject.mockReturnValue({
      nativeAssets: [{ symbol: 'KAR', existentialDeposit: '1000000000' }],
      otherAssets: []
    } as unknown as TNodeAssets)

    mockedGetAssetBySymbolOrId.mockReturnValue(null)

    expect(() => getExistentialDeposit(node, currency)).toThrow(InvalidCurrencyError)
  })
})
