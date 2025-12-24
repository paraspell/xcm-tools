import type { TChain, TLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidCurrencyError } from '../../errors'
import type { TAssetInfo, TCurrencyInput } from '../../types'
import { Foreign, Native } from '../assetSelectors'
import { isStableCoinAsset } from '../isStableCoinAsset'
import { findAssetInfo } from './findAssetInfo'
import { findAssetInfoOnDest, findAssetOnDestOrThrow } from './findAssetInfoOnDest'
import { findAssetInfoOrThrow } from './findAssetInfoOrThrow'
import { findStablecoinAssets } from './findStablecoinAssets'

vi.mock('./findAssetInfo')
vi.mock('./findAssetInfoOrThrow')
vi.mock('./findStablecoinAssets')
vi.mock('../isStableCoinAsset')

const mockOriginChain: TChain = 'Acala'
const mockDestinationChain: TChain = 'AssetHubPolkadot'

const mockAssetSymbol = 'DOT'
const mockLocation = {} as TLocation

const mockOriginAssetWithLocation: TAssetInfo = {
  symbol: mockAssetSymbol,
  assetId: '1',
  decimals: 10,
  location: mockLocation
}

const mockOriginAssetWithoutLocation: TAssetInfo = {
  symbol: mockAssetSymbol,
  assetId: '1',
  decimals: 10
}

const mockDestinationAsset: TAssetInfo = {
  symbol: mockAssetSymbol,
  assetId: '2',
  decimals: 12,
  location: mockLocation
}

const mockStablecoinAsset: TAssetInfo = {
  symbol: 'USDx',
  assetId: '999',
  decimals: 12,
  location: {
    parents: 1,
    interior: {
      X2: [{ PalletInstance: 50 }, { GeneralIndex: 1984 }]
    }
  } as TLocation
}

describe('findAssetOnDest', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(isStableCoinAsset).mockReturnValue(false)
    vi.mocked(findStablecoinAssets).mockReturnValue([])
  })

  it('should find asset on destination by location if origin asset has location and asset is found', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce(mockOriginAssetWithLocation)
    vi.mocked(findAssetInfo).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetInfoOnDest(mockOriginChain, mockDestinationChain, currencyInput)

    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(
      mockOriginChain,
      currencyInput,
      mockDestinationChain
    )
    expect(findAssetInfo).toHaveBeenCalledWith(
      mockDestinationChain,
      { location: mockLocation },
      null
    )
    expect(result).toEqual(mockDestinationAsset)
    expect(findAssetInfoOrThrow).toHaveBeenCalledTimes(1)
  })

  it('should find asset on destination by symbol if origin asset has location but asset is NOT found by location', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce(mockOriginAssetWithLocation)
    vi.mocked(findAssetInfo).mockReturnValueOnce(null).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetInfoOnDest(mockOriginChain, mockDestinationChain, currencyInput)

    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(
      mockOriginChain,
      currencyInput,
      mockDestinationChain
    )
    expect(findAssetInfo).toHaveBeenCalledWith(
      mockDestinationChain,
      { location: mockLocation },
      null
    )
    expect(findAssetInfo).toHaveBeenCalledWith(
      mockDestinationChain,
      { symbol: mockAssetSymbol },
      null
    )
    expect(result).toEqual(mockDestinationAsset)
    expect(findAssetInfoOrThrow).toHaveBeenCalledTimes(1)
    expect(findAssetInfo).toHaveBeenCalledTimes(2)
  })

  it('should find asset on destination by symbol if origin asset does NOT have location', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce(mockOriginAssetWithoutLocation)
    vi.mocked(findAssetInfo).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetInfoOnDest(mockOriginChain, mockDestinationChain, currencyInput)

    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(
      mockOriginChain,
      currencyInput,
      mockDestinationChain
    )
    expect(findAssetInfo).toHaveBeenCalledWith(
      mockDestinationChain,
      { symbol: mockAssetSymbol },
      null
    )
    expect(result).toEqual(mockDestinationAsset)
    expect(findAssetInfoOrThrow).toHaveBeenCalledTimes(1)
    expect(findAssetInfo).toHaveBeenCalledTimes(1)
  })

  it('should lookup native asset first for substrate bridge (AssetHubPolkadot -> AssetHubKusama)', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce(mockOriginAssetWithLocation)
    vi.mocked(findAssetInfo).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetInfoOnDest('AssetHubPolkadot', 'AssetHubKusama', currencyInput)

    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(
      'AssetHubPolkadot',
      currencyInput,
      'AssetHubKusama'
    )
    expect(findAssetInfo).toHaveBeenCalledWith(
      'AssetHubKusama',
      { symbol: Native(mockOriginAssetWithLocation.symbol) },
      null
    )
    expect(result).toEqual(mockDestinationAsset)
    expect(findAssetInfo).toHaveBeenCalledTimes(1)
  })

  it('should return stablecoin match when native is missing on substrate bridge', () => {
    const currencyInput: TCurrencyInput = { symbol: mockStablecoinAsset.symbol }

    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce({
      ...mockStablecoinAsset,
      assetId: 'origin-stable'
    })

    vi.mocked(isStableCoinAsset).mockReturnValue(true)

    vi.mocked(findAssetInfo)
      .mockReturnValueOnce(null) // native lookup
      .mockReturnValueOnce(null) // foreign lookup

    vi.mocked(findStablecoinAssets).mockReturnValueOnce([mockStablecoinAsset])

    const result = findAssetInfoOnDest('AssetHubPolkadot', 'AssetHubKusama', currencyInput)

    expect(findStablecoinAssets).toHaveBeenCalledWith('AssetHubKusama')
    expect(result).toEqual(mockStablecoinAsset)
    expect(findAssetInfo).toHaveBeenCalledTimes(1)
  })

  it('should fall back to foreign selector when native asset is missing on substrate bridge', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce(mockOriginAssetWithLocation)
    vi.mocked(findAssetInfo).mockReturnValueOnce(null).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetInfoOnDest('AssetHubPolkadot', 'AssetHubKusama', currencyInput)

    expect(findAssetInfo).toHaveBeenNthCalledWith(
      1,
      'AssetHubKusama',
      { symbol: Native(mockOriginAssetWithLocation.symbol) },
      null
    )
    expect(findAssetInfo).toHaveBeenNthCalledWith(
      2,
      'AssetHubKusama',
      { symbol: Foreign(mockOriginAssetWithLocation.symbol) },
      null
    )
    expect(result).toEqual(mockDestinationAsset)
  })

  it('should return null when substrate bridge asset is missing for both native and foreign selectors', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce(mockOriginAssetWithLocation)
    vi.mocked(findAssetInfo).mockReturnValueOnce(null).mockReturnValueOnce(null)

    const result = findAssetInfoOnDest('AssetHubKusama', 'AssetHubPolkadot', currencyInput)

    expect(findAssetInfo).toHaveBeenCalledWith(
      'AssetHubPolkadot',
      { symbol: Native(mockOriginAssetWithLocation.symbol) },
      null
    )
    expect(findAssetInfo).toHaveBeenCalledWith(
      'AssetHubPolkadot',
      { symbol: Foreign(mockOriginAssetWithLocation.symbol) },
      null
    )
    expect(result).toBeNull()
    expect(findAssetInfo).toHaveBeenCalledTimes(2)
  })

  it('should return null if asset is not found on destination', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce(mockOriginAssetWithLocation)
    vi.mocked(findAssetInfo).mockReturnValueOnce(null).mockReturnValueOnce(null)

    const result = findAssetInfoOnDest(mockOriginChain, mockDestinationChain, currencyInput)

    expect(result).toBeNull()
    expect(findAssetInfo).toHaveBeenCalledTimes(2)
  })

  it('should throw error if findAssetInfoOrThrow throws an error', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }
    const expectedError = new Error('Asset not found on origin')

    vi.mocked(findAssetInfoOrThrow).mockImplementationOnce(() => {
      throw expectedError
    })

    expect(() => findAssetInfoOnDest(mockOriginChain, mockDestinationChain, currencyInput)).toThrow(
      expectedError
    )
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(
      mockOriginChain,
      currencyInput,
      mockDestinationChain
    )
    expect(findAssetInfo).not.toHaveBeenCalled()
  })

  it('should use provided origin asset instead of resolving when available', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfo).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetInfoOnDest(
      mockOriginChain,
      mockDestinationChain,
      currencyInput,
      mockOriginAssetWithLocation
    )

    expect(findAssetInfoOrThrow).not.toHaveBeenCalled()
    expect(findAssetInfo).toHaveBeenCalledWith(
      mockDestinationChain,
      { location: mockLocation },
      null
    )
    expect(result).toEqual(mockDestinationAsset)
  })
})

describe('findAssetOnDestOrThrow', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(isStableCoinAsset).mockReturnValue(false)
    vi.mocked(findStablecoinAssets).mockReturnValue([])
  })

  it('should return asset when findAssetOnDest returns an asset', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce(mockOriginAssetWithLocation)
    vi.mocked(findAssetInfo).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetOnDestOrThrow(mockOriginChain, mockDestinationChain, currencyInput)

    expect(result).toEqual(mockDestinationAsset)
  })

  it('should throw InvalidCurrencyError when findAssetOnDest returns null', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce(mockOriginAssetWithLocation)
    vi.mocked(findAssetInfo).mockReturnValueOnce(null).mockReturnValueOnce(null)

    expect(() =>
      findAssetOnDestOrThrow(mockOriginChain, mockDestinationChain, currencyInput)
    ).toThrow(InvalidCurrencyError)
  })

  it('should propagate errors from findAssetOnDest', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }
    const expectedError = new Error('Asset not found on origin')

    vi.mocked(findAssetInfoOrThrow).mockImplementationOnce(() => {
      throw expectedError
    })

    expect(() =>
      findAssetOnDestOrThrow(mockOriginChain, mockDestinationChain, currencyInput)
    ).toThrow(expectedError)
  })
})
