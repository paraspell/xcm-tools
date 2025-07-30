import type { TChain, TLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidCurrencyError } from '../../errors'
import type { TAssetInfo, TCurrencyInput } from '../../types'
import { findAssetInfo } from './findAssetInfo'
import { findAssetInfoOnDest, findAssetOnDestOrThrow } from './findAssetInfoOnDest'
import { findAssetInfoOrThrow } from './findAssetInfoOrThrow'

vi.mock('./findAssetInfo')
vi.mock('./findAssetInfoOrThrow')

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

describe('findAssetOnDest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('should skip location lookup for DOT/KSM bridge (AssetHubPolkadot -> AssetHubKusama)', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce(mockOriginAssetWithLocation)
    vi.mocked(findAssetInfo).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetInfoOnDest('AssetHubPolkadot', 'AssetHubKusama', currencyInput)

    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(
      'AssetHubPolkadot',
      currencyInput,
      'AssetHubKusama'
    )
    expect(findAssetInfo).toHaveBeenCalledWith('AssetHubKusama', { symbol: mockAssetSymbol }, null)
    expect(result).toEqual(mockDestinationAsset)
    expect(findAssetInfo).toHaveBeenCalledTimes(1)
  })

  it('should skip location lookup for DOT/KSM bridge (AssetHubKusama -> AssetHubPolkadot)', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce(mockOriginAssetWithLocation)
    vi.mocked(findAssetInfo).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetInfoOnDest('AssetHubKusama', 'AssetHubPolkadot', currencyInput)

    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(
      'AssetHubKusama',
      currencyInput,
      'AssetHubPolkadot'
    )
    expect(findAssetInfo).toHaveBeenCalledWith(
      'AssetHubPolkadot',
      { symbol: mockAssetSymbol },
      null
    )
    expect(result).toEqual(mockDestinationAsset)
    expect(findAssetInfo).toHaveBeenCalledTimes(1)
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
})

describe('findAssetOnDestOrThrow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
