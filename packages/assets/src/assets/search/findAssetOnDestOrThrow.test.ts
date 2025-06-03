import type { TMultiLocation, TNodeWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TAsset, TCurrencyInput } from '../../types'
import { findAsset } from './findAsset'
import { findAssetForNodeOrThrow } from './findAssetForNodeOrThrow'
import { findAssetOnDestOrThrow } from './findAssetOnDestOrThrow'

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

describe('findAssetOnDestOrThrow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should find asset on destination by multiLocation if origin asset has multiLocation and asset is found', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetForNodeOrThrow).mockReturnValueOnce(mockOriginAssetWithMultiLocation)
    vi.mocked(findAsset).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetOnDestOrThrow(mockOriginNode, mockDestinationNode, currencyInput)

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

    vi.mocked(findAssetForNodeOrThrow)
      .mockReturnValueOnce(mockOriginAssetWithMultiLocation)
      .mockReturnValueOnce(mockDestinationAsset)

    vi.mocked(findAsset).mockReturnValueOnce(null)

    const result = findAssetOnDestOrThrow(mockOriginNode, mockDestinationNode, currencyInput)

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
    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(
      mockDestinationNode,
      { symbol: mockAssetSymbol },
      null
    )
    expect(result).toEqual(mockDestinationAsset)
    expect(findAssetForNodeOrThrow).toHaveBeenCalledTimes(2)
  })

  it('should find asset on destination by symbol if origin asset does NOT have multiLocation', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetForNodeOrThrow)
      .mockReturnValueOnce(mockOriginAssetWithoutMultiLocation)
      .mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetOnDestOrThrow(mockOriginNode, mockDestinationNode, currencyInput)

    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(
      mockOriginNode,
      currencyInput,
      mockDestinationNode
    )
    expect(findAsset).not.toHaveBeenCalled()
    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(
      mockDestinationNode,
      { symbol: mockAssetSymbol },
      null
    )
    expect(result).toEqual(mockDestinationAsset)
    expect(findAssetForNodeOrThrow).toHaveBeenCalledTimes(2)
  })

  it('should throw error if findAssetForNodeOrThrow (for origin) throws an error', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }
    const expectedError = new Error('Asset not found on origin')

    vi.mocked(findAssetForNodeOrThrow).mockImplementationOnce(() => {
      throw expectedError
    })

    expect(() =>
      findAssetOnDestOrThrow(mockOriginNode, mockDestinationNode, currencyInput)
    ).toThrow(expectedError)
    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(
      mockOriginNode,
      currencyInput,
      mockDestinationNode
    )
    expect(findAsset).not.toHaveBeenCalled()
  })

  it('should throw error if findAssetForNodeOrThrow (for destination by symbol) throws an error when multiLocation lookup fails', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }
    const expectedError = new Error('Asset not found on destination by symbol')

    vi.mocked(findAssetForNodeOrThrow)
      .mockReturnValueOnce(mockOriginAssetWithMultiLocation)
      .mockImplementationOnce(() => {
        throw expectedError
      })

    vi.mocked(findAsset).mockReturnValueOnce(null)

    expect(() =>
      findAssetOnDestOrThrow(mockOriginNode, mockDestinationNode, currencyInput)
    ).toThrow(expectedError)
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
    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(
      mockDestinationNode,
      { symbol: mockAssetSymbol },
      null
    )
  })

  it('should throw error if findAssetForNodeOrThrow (for destination by symbol) throws an error when origin asset has no multiLocation', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }
    const expectedError = new Error('Asset not found on destination by symbol')

    vi.mocked(findAssetForNodeOrThrow)
      .mockReturnValueOnce(mockOriginAssetWithoutMultiLocation)
      .mockImplementationOnce(() => {
        throw expectedError
      })

    expect(() =>
      findAssetOnDestOrThrow(mockOriginNode, mockDestinationNode, currencyInput)
    ).toThrow(expectedError)
    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(
      mockOriginNode,
      currencyInput,
      mockDestinationNode
    )
    expect(findAsset).not.toHaveBeenCalled()
    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(
      mockDestinationNode,
      { symbol: mockAssetSymbol },
      null
    )
  })
})
