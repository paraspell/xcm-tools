import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getOtherAssets } from './assets'
import { findAssetByMultiLocation } from './findAssetByMultiLocation'
import { filterEthCompatibleAssets } from './filterEthCompatibleAssets'
import type { TForeignAsset, TJunction, TMultiLocation } from '../../types'

vi.mock('./assets', () => ({
  getOtherAssets: vi.fn()
}))

vi.mock('./findAssetByMultiLocation', () => ({
  findAssetByMultiLocation: vi.fn()
}))

describe('filterEthCompatibleAssets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array if asset has no multiLocation or xcmInterior', () => {
    const assets = [{ assetId: 'asset1' }, { assetId: 'asset2' }] as TForeignAsset[]
    vi.mocked(getOtherAssets).mockReturnValue([])
    const result = filterEthCompatibleAssets(assets)
    expect(result).toEqual([])
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
    expect(findAssetByMultiLocation).not.toHaveBeenCalled()
  })

  it('returns asset if findAssetByMultiLocation returns truthy for multiLocation', () => {
    const ethAssets = [{ assetId: 'eth1' }] as TForeignAsset[]
    vi.mocked(getOtherAssets).mockReturnValue(ethAssets)
    const asset = {
      symbol: '',
      assetId: 'asset1',
      multiLocation: 'valid' as unknown as TMultiLocation
    } as TForeignAsset
    vi.mocked(findAssetByMultiLocation).mockImplementation((_ethAssets, assetML) =>
      assetML === 'valid' ? { assetId: 'eth1', symbol: '' } : undefined
    )
    const result = filterEthCompatibleAssets([asset])
    expect(result).toEqual([asset])
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
    expect(findAssetByMultiLocation).toHaveBeenCalledWith(ethAssets, 'valid')
  })

  it('returns asset if findAssetByMultiLocation returns truthy for xcmInterior when multiLocation is not present', () => {
    const ethAssets = [{ assetId: 'eth1' }] as TForeignAsset[]
    vi.mocked(getOtherAssets).mockReturnValue(ethAssets)
    const asset = {
      symbol: '',
      assetId: 'asset2',
      xcmInterior: 'valid_xcm' as unknown as TJunction[]
    } as TForeignAsset
    vi.mocked(findAssetByMultiLocation).mockImplementation((_ethAssets, assetML) =>
      assetML === 'valid_xcm' ? { symbol: '', assetId: 'eth1' } : undefined
    )
    const result = filterEthCompatibleAssets([asset])
    expect(result).toEqual([asset])
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
    expect(findAssetByMultiLocation).toHaveBeenCalledWith(ethAssets, 'valid_xcm')
  })

  it('filters out asset when findAssetByMultiLocation returns falsy', () => {
    const ethAssets = [{ assetId: 'eth1' }] as TForeignAsset[]
    vi.mocked(getOtherAssets).mockReturnValue(ethAssets)
    const asset = {
      symbol: '',
      assetId: 'asset3',
      multiLocation: 'invalid' as unknown as TMultiLocation
    } as TForeignAsset
    vi.mocked(findAssetByMultiLocation).mockReturnValue(undefined)
    const result = filterEthCompatibleAssets([asset])
    expect(result).toEqual([])
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
    expect(findAssetByMultiLocation).toHaveBeenCalledWith(ethAssets, 'invalid')
  })

  it('handles multiple assets and returns only valid ones', () => {
    const ethAssets = [{ assetId: 'eth1' }] as TForeignAsset[]
    vi.mocked(getOtherAssets).mockReturnValue(ethAssets)
    const asset1 = {
      symbol: '',
      id: 'asset1',
      multiLocation: 'valid' as unknown as TMultiLocation
    } as TForeignAsset
    const asset2 = {
      symbol: '',
      assetId: 'asset2',
      multiLocation: 'invalid'
    } as unknown as TForeignAsset
    const asset3 = {
      symbol: '',
      assetId: 'asset3',
      xcmInterior: 'valid_xcm'
    } as unknown as TForeignAsset
    const asset4 = { symbol: '', assetId: 'asset4' } as TForeignAsset
    vi.mocked(findAssetByMultiLocation).mockImplementation((_ethAssets, assetML) =>
      assetML === 'valid' || assetML === 'valid_xcm' ? { symbol: '', assetId: 'eth1' } : undefined
    )
    const result = filterEthCompatibleAssets([asset1, asset2, asset3, asset4])
    expect(result).toEqual([asset1, asset3])
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
    expect(findAssetByMultiLocation).toHaveBeenCalledTimes(3)
  })
})
