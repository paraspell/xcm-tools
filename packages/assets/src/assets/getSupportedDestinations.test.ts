import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DuplicateAssetError, InvalidCurrencyError } from '../errors'
import type { TAsset } from '../types'
import { getSupportedDestinations } from './getSupportedDestinations'
import { findAssetForNodeOrThrow, findAssetOnDest } from './search'

vi.mock('./search', () => ({
  findAssetForNodeOrThrow: vi.fn(),
  findAssetOnDest: vi.fn()
}))

vi.mock('@paraspell/sdk-common', () => ({
  NODES_WITH_RELAY_CHAINS: ['Polkadot', 'Kusama', 'Acala', 'Moonbeam', 'Astar']
}))

describe('getSupportedDestinations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return destinations where asset is found by symbol', () => {
    const origin = 'Polkadot'
    const currency = { symbol: 'DOT' }
    const originAsset = {
      symbol: 'DOT'
    } as TAsset

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue(originAsset)
    vi.mocked(findAssetOnDest)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({ symbol: 'DOT' } as TAsset)
      .mockReturnValueOnce({ symbol: 'DOT' } as TAsset)
      .mockReturnValueOnce(null)

    const result = getSupportedDestinations(origin, currency)

    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(origin, currency, null)
    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(origin, currency, 'Kusama')
    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(origin, currency, 'Acala')
    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(origin, currency, 'Moonbeam')
    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(origin, currency, 'Astar')
    expect(findAssetOnDest).toHaveBeenCalledTimes(4)
    expect(findAssetOnDest).toHaveBeenCalledWith(origin, 'Kusama', currency, originAsset)
    expect(findAssetOnDest).toHaveBeenCalledWith(origin, 'Acala', currency, originAsset)
    expect(findAssetOnDest).toHaveBeenCalledWith(origin, 'Moonbeam', currency, originAsset)
    expect(findAssetOnDest).toHaveBeenCalledWith(origin, 'Astar', currency, originAsset)
    expect(result).toEqual(['Acala', 'Moonbeam'])
  })

  it('should exclude origin node from results', () => {
    const origin = 'Polkadot'
    const currency = { symbol: 'DOT' }
    const originAsset = {
      symbol: 'DOT'
    } as TAsset

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue(originAsset)
    vi.mocked(findAssetOnDest).mockReturnValue({ symbol: 'DOT' } as TAsset)

    const result = getSupportedDestinations(origin, currency)

    expect(result).not.toContain(origin)
    expect(findAssetOnDest).toHaveBeenCalledTimes(4)
  })

  it('should include destination when DuplicateAssetError is thrown', () => {
    const origin = 'Polkadot'
    const currency = { symbol: 'DOT' }
    const originAsset = {
      symbol: 'DOT'
    } as TAsset

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue(originAsset)
    vi.mocked(findAssetOnDest)
      .mockImplementationOnce(() => {
        throw new DuplicateAssetError('Multiple assets found')
      })
      .mockReturnValueOnce({ symbol: 'DOT' } as TAsset)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null)

    const result = getSupportedDestinations(origin, currency)

    expect(result).toEqual(['Kusama', 'Acala'])
  })

  it('should exclude destination when InvalidCurrencyError is thrown from findAssetForNodeOrThrow', () => {
    const origin = 'Polkadot'
    const currency = { symbol: 'DOT' }
    const originAsset = {
      symbol: 'DOT'
    } as TAsset

    vi.mocked(findAssetForNodeOrThrow)
      .mockReturnValueOnce(originAsset)
      .mockImplementationOnce(() => {
        throw new InvalidCurrencyError('Invalid currency for destination')
      })
      .mockReturnValueOnce(originAsset)
      .mockReturnValueOnce(originAsset)
      .mockReturnValueOnce(originAsset)

    vi.mocked(findAssetOnDest)
      .mockReturnValueOnce({ symbol: 'DOT' } as TAsset)
      .mockReturnValueOnce({ symbol: 'DOT' } as TAsset)
      .mockReturnValueOnce({ symbol: 'DOT' } as TAsset)

    const result = getSupportedDestinations(origin, currency)

    expect(result).toEqual(['Acala', 'Moonbeam', 'Astar'])
  })

  it('should re-throw non-InvalidCurrencyError errors from findAssetForNodeOrThrow', () => {
    const origin = 'Polkadot'
    const currency = { symbol: 'DOT' }
    const originAsset = {
      symbol: 'DOT'
    } as TAsset

    vi.mocked(findAssetForNodeOrThrow)
      .mockReturnValueOnce(originAsset)
      .mockImplementationOnce(() => {
        throw new Error('Some other error')
      })

    expect(() => getSupportedDestinations(origin, currency)).toThrow('Some other error')
  })

  it('should re-throw non-DuplicateAssetError errors from findAssetOnDest', () => {
    const origin = 'Polkadot'
    const currency = { symbol: 'DOT' }
    const originAsset = {
      symbol: 'DOT'
    } as TAsset

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue(originAsset)
    vi.mocked(findAssetOnDest).mockImplementationOnce(() => {
      throw new Error('Some other error')
    })

    expect(() => getSupportedDestinations(origin, currency)).toThrow('Some other error')
  })

  it('should propagate errors from initial findAssetForNodeOrThrow call', () => {
    const origin = 'Polkadot'
    const currency = { symbol: 'DOT' }

    vi.mocked(findAssetForNodeOrThrow).mockImplementationOnce(() => {
      throw new Error('Asset not found for origin')
    })

    expect(() => getSupportedDestinations(origin, currency)).toThrow('Asset not found for origin')
  })

  it('should return empty array when no destinations support the asset', () => {
    const origin = 'Polkadot'
    const currency = { symbol: 'RARE_TOKEN' }
    const originAsset = {
      symbol: 'RARE_TOKEN'
    } as TAsset

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue(originAsset)
    vi.mocked(findAssetOnDest).mockReturnValue(null)

    const result = getSupportedDestinations(origin, currency)

    expect(result).toEqual([])
  })
})
