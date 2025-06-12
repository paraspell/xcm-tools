import type { TMultiLocation, TNodeWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidCurrencyError } from '../../errors'
import type { TAsset, TCurrencyInput } from '../../types'
import { findAsset } from './findAsset'
import { findAssetForNodeOrThrow } from './findAssetForNodeOrThrow'
import { findAssetOnDest, findAssetOnDestOrThrow } from './findAssetOnDest'

vi.mock('./findAsset')
vi.mock('./findAssetForNodeOrThrow')

const mockOriginNode = 'OriginNode' as TNodeWithRelayChains
const mockDestinationNode = 'DestinationNode' as TNodeWithRelayChains

const mockAssetSymbol = 'DOT'
const mockAssetMultiLocation = {} as TMultiLocation

const mockOriginAssetWithMultiLocation: TAsset = {
  symbol: mockAssetSymbol,
  assetId: '1',
  decimals: 10,
  multiLocation: mockAssetMultiLocation
}

const mockOriginAssetWithoutMultiLocation: TAsset = {
  symbol: mockAssetSymbol,
  assetId: '1',
  decimals: 10
}

const mockDestinationAsset: TAsset = {
  symbol: mockAssetSymbol,
  assetId: '2',
  decimals: 12,
  multiLocation: mockAssetMultiLocation
}

describe('findAssetOnDest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should find asset on destination by multiLocation if origin asset has multiLocation and asset is found', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetForNodeOrThrow).mockReturnValueOnce(mockOriginAssetWithMultiLocation)
    vi.mocked(findAsset).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetOnDest(mockOriginNode, mockDestinationNode, currencyInput)

    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(
      mockOriginNode,
      currencyInput,
      mockDestinationNode
    )
    expect(findAsset).toHaveBeenCalledWith(
      mockDestinationNode,
      { multilocation: mockAssetMultiLocation },
      null
    )
    expect(result).toEqual(mockDestinationAsset)
    expect(findAssetForNodeOrThrow).toHaveBeenCalledTimes(1)
  })

  it('should find asset on destination by symbol if origin asset has multiLocation but asset is NOT found by multiLocation', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetForNodeOrThrow).mockReturnValueOnce(mockOriginAssetWithMultiLocation)
    vi.mocked(findAsset).mockReturnValueOnce(null).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetOnDest(mockOriginNode, mockDestinationNode, currencyInput)

    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(
      mockOriginNode,
      currencyInput,
      mockDestinationNode
    )
    expect(findAsset).toHaveBeenCalledWith(
      mockDestinationNode,
      { multilocation: mockAssetMultiLocation },
      null
    )
    expect(findAsset).toHaveBeenCalledWith(mockDestinationNode, { symbol: mockAssetSymbol }, null)
    expect(result).toEqual(mockDestinationAsset)
    expect(findAssetForNodeOrThrow).toHaveBeenCalledTimes(1)
    expect(findAsset).toHaveBeenCalledTimes(2)
  })

  it('should find asset on destination by symbol if origin asset does NOT have multiLocation', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetForNodeOrThrow).mockReturnValueOnce(mockOriginAssetWithoutMultiLocation)
    vi.mocked(findAsset).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetOnDest(mockOriginNode, mockDestinationNode, currencyInput)

    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(
      mockOriginNode,
      currencyInput,
      mockDestinationNode
    )
    expect(findAsset).toHaveBeenCalledWith(mockDestinationNode, { symbol: mockAssetSymbol }, null)
    expect(result).toEqual(mockDestinationAsset)
    expect(findAssetForNodeOrThrow).toHaveBeenCalledTimes(1)
    expect(findAsset).toHaveBeenCalledTimes(1)
  })

  it('should skip multiLocation lookup for DOT/KSM bridge (AssetHubPolkadot -> AssetHubKusama)', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetForNodeOrThrow).mockReturnValueOnce(mockOriginAssetWithMultiLocation)
    vi.mocked(findAsset).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetOnDest('AssetHubPolkadot', 'AssetHubKusama', currencyInput)

    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(
      'AssetHubPolkadot',
      currencyInput,
      'AssetHubKusama'
    )
    expect(findAsset).toHaveBeenCalledWith('AssetHubKusama', { symbol: mockAssetSymbol }, null)
    expect(result).toEqual(mockDestinationAsset)
    expect(findAsset).toHaveBeenCalledTimes(1)
  })

  it('should skip multiLocation lookup for DOT/KSM bridge (AssetHubKusama -> AssetHubPolkadot)', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetForNodeOrThrow).mockReturnValueOnce(mockOriginAssetWithMultiLocation)
    vi.mocked(findAsset).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetOnDest('AssetHubKusama', 'AssetHubPolkadot', currencyInput)

    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(
      'AssetHubKusama',
      currencyInput,
      'AssetHubPolkadot'
    )
    expect(findAsset).toHaveBeenCalledWith('AssetHubPolkadot', { symbol: mockAssetSymbol }, null)
    expect(result).toEqual(mockDestinationAsset)
    expect(findAsset).toHaveBeenCalledTimes(1)
  })

  it('should return null if asset is not found on destination', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetForNodeOrThrow).mockReturnValueOnce(mockOriginAssetWithMultiLocation)
    vi.mocked(findAsset).mockReturnValueOnce(null).mockReturnValueOnce(null)

    const result = findAssetOnDest(mockOriginNode, mockDestinationNode, currencyInput)

    expect(result).toBeNull()
    expect(findAsset).toHaveBeenCalledTimes(2)
  })

  it('should throw error if findAssetForNodeOrThrow throws an error', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }
    const expectedError = new Error('Asset not found on origin')

    vi.mocked(findAssetForNodeOrThrow).mockImplementationOnce(() => {
      throw expectedError
    })

    expect(() => findAssetOnDest(mockOriginNode, mockDestinationNode, currencyInput)).toThrow(
      expectedError
    )
    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(
      mockOriginNode,
      currencyInput,
      mockDestinationNode
    )
    expect(findAsset).not.toHaveBeenCalled()
  })
})

describe('findAssetOnDestOrThrow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return asset when findAssetOnDest returns an asset', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetForNodeOrThrow).mockReturnValueOnce(mockOriginAssetWithMultiLocation)
    vi.mocked(findAsset).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetOnDestOrThrow(mockOriginNode, mockDestinationNode, currencyInput)

    expect(result).toEqual(mockDestinationAsset)
  })

  it('should throw InvalidCurrencyError when findAssetOnDest returns null', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetForNodeOrThrow).mockReturnValueOnce(mockOriginAssetWithMultiLocation)
    vi.mocked(findAsset).mockReturnValueOnce(null).mockReturnValueOnce(null)

    expect(() =>
      findAssetOnDestOrThrow(mockOriginNode, mockDestinationNode, currencyInput)
    ).toThrow(InvalidCurrencyError)
  })

  it('should propagate errors from findAssetOnDest', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }
    const expectedError = new Error('Asset not found on origin')

    vi.mocked(findAssetForNodeOrThrow).mockImplementationOnce(() => {
      throw expectedError
    })

    expect(() =>
      findAssetOnDestOrThrow(mockOriginNode, mockDestinationNode, currencyInput)
    ).toThrow(expectedError)
  })
})
