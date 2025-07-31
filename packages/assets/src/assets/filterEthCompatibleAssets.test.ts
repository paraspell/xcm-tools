import type { TLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TForeignAssetInfo } from '../types'
import { getOtherAssets } from './assets'
import { filterEthCompatibleAssets } from './filterEthCompatibleAssets'
import { findAssetInfoByLoc } from './search'

vi.mock('./assets', () => ({
  getOtherAssets: vi.fn()
}))

vi.mock('./search', () => ({
  findAssetInfoByLoc: vi.fn()
}))

describe('filterEthCompatibleAssets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array if asset has no location', () => {
    const assets = [{ assetId: 'asset1' }, { assetId: 'asset2' }] as TForeignAssetInfo[]
    vi.mocked(getOtherAssets).mockReturnValue([])
    const result = filterEthCompatibleAssets(assets)
    expect(result).toEqual([])
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
    expect(findAssetInfoByLoc).not.toHaveBeenCalled()
  })

  it('returns asset if findAssetByLocation returns truthy for location', () => {
    const ethAssets = [{ assetId: 'eth1' }] as TForeignAssetInfo[]
    vi.mocked(getOtherAssets).mockReturnValue(ethAssets)
    const asset = {
      symbol: '',
      assetId: 'asset1',
      location: 'valid' as unknown as TLocation
    } as TForeignAssetInfo
    vi.mocked(findAssetInfoByLoc).mockImplementation((_ethAssets, assetML) =>
      assetML === 'valid' ? { assetId: 'eth1', symbol: '' } : undefined
    )
    const result = filterEthCompatibleAssets([asset])
    expect(result).toEqual([asset])
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
    expect(findAssetInfoByLoc).toHaveBeenCalledWith(ethAssets, 'valid')
  })

  it('filters out asset when findAssetByLocation returns falsy', () => {
    const ethAssets = [{ assetId: 'eth1' }] as TForeignAssetInfo[]
    vi.mocked(getOtherAssets).mockReturnValue(ethAssets)
    const asset = {
      symbol: '',
      assetId: 'asset3',
      location: 'invalid' as unknown as TLocation
    } as TForeignAssetInfo
    vi.mocked(findAssetInfoByLoc).mockReturnValue(undefined)
    const result = filterEthCompatibleAssets([asset])
    expect(result).toEqual([])
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
    expect(findAssetInfoByLoc).toHaveBeenCalledWith(ethAssets, 'invalid')
  })

  it('handles multiple assets and returns only valid ones', () => {
    const ethAssets = [{ assetId: 'eth1' }] as TForeignAssetInfo[]
    vi.mocked(getOtherAssets).mockReturnValue(ethAssets)
    const asset1 = {
      symbol: '',
      id: 'asset1',
      location: 'valid' as unknown as TLocation
    } as TForeignAssetInfo
    const asset2 = {
      symbol: '',
      assetId: 'asset2',
      location: 'invalid'
    } as unknown as TForeignAssetInfo
    const asset3 = {
      symbol: '',
      location: 'valid',
      assetId: 'asset3'
    } as unknown as TForeignAssetInfo
    const asset4 = { symbol: '', assetId: 'asset4' } as TForeignAssetInfo
    vi.mocked(findAssetInfoByLoc).mockImplementation((_ethAssets, assetML) =>
      assetML === 'valid' || assetML === 'valid_xcm' ? { symbol: '', assetId: 'eth1' } : undefined
    )
    const result = filterEthCompatibleAssets([asset1, asset2, asset3, asset4])
    expect(result).toEqual([asset1, asset3])
    expect(getOtherAssets).toHaveBeenCalledWith('Ethereum')
    expect(findAssetInfoByLoc).toHaveBeenCalledTimes(3)
  })
})
