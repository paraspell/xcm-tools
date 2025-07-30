import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DuplicateAssetError, InvalidCurrencyError } from '../errors'
import type { TAssetInfo } from '../types'
import { getSupportedDestinations } from './getSupportedDestinations'
import { findAssetInfoOnDest, findAssetInfoOrThrow } from './search'

vi.mock('./search', () => ({
  findAssetInfoOrThrow: vi.fn(),
  findAssetInfoOnDest: vi.fn()
}))

vi.mock('@paraspell/sdk-common', () => ({
  CHAINS: ['Polkadot', 'Kusama', 'Acala', 'Moonbeam', 'Astar']
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
    } as TAssetInfo

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(originAsset)
    vi.mocked(findAssetInfoOnDest)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({ symbol: 'DOT' } as TAssetInfo)
      .mockReturnValueOnce({ symbol: 'DOT' } as TAssetInfo)
      .mockReturnValueOnce(null)

    const result = getSupportedDestinations(origin, currency)

    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(origin, currency, null)
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(origin, currency, 'Kusama')
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(origin, currency, 'Acala')
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(origin, currency, 'Moonbeam')
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(origin, currency, 'Astar')
    expect(findAssetInfoOnDest).toHaveBeenCalledTimes(4)
    expect(findAssetInfoOnDest).toHaveBeenCalledWith(origin, 'Kusama', currency, originAsset)
    expect(findAssetInfoOnDest).toHaveBeenCalledWith(origin, 'Acala', currency, originAsset)
    expect(findAssetInfoOnDest).toHaveBeenCalledWith(origin, 'Moonbeam', currency, originAsset)
    expect(findAssetInfoOnDest).toHaveBeenCalledWith(origin, 'Astar', currency, originAsset)
    expect(result).toEqual(['Acala', 'Moonbeam'])
  })

  it('should exclude origin chain from results', () => {
    const origin = 'Polkadot'
    const currency = { symbol: 'DOT' }
    const originAsset = {
      symbol: 'DOT'
    } as TAssetInfo

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(originAsset)
    vi.mocked(findAssetInfoOnDest).mockReturnValue({ symbol: 'DOT' } as TAssetInfo)

    const result = getSupportedDestinations(origin, currency)

    expect(result).not.toContain(origin)
    expect(findAssetInfoOnDest).toHaveBeenCalledTimes(4)
  })

  it('should include destination when DuplicateAssetError is thrown', () => {
    const origin = 'Polkadot'
    const currency = { symbol: 'DOT' }
    const originAsset = {
      symbol: 'DOT'
    } as TAssetInfo

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(originAsset)
    vi.mocked(findAssetInfoOnDest)
      .mockImplementationOnce(() => {
        throw new DuplicateAssetError('Multiple assets found')
      })
      .mockReturnValueOnce({ symbol: 'DOT' } as TAssetInfo)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null)

    const result = getSupportedDestinations(origin, currency)

    expect(result).toEqual(['Kusama', 'Acala'])
  })

  it('should exclude destination when InvalidCurrencyError is thrown from findAssetInfoOrThrow', () => {
    const origin = 'Polkadot'
    const currency = { symbol: 'DOT' }
    const originAsset = {
      symbol: 'DOT'
    } as TAssetInfo

    vi.mocked(findAssetInfoOrThrow)
      .mockReturnValueOnce(originAsset)
      .mockImplementationOnce(() => {
        throw new InvalidCurrencyError('Invalid currency for destination')
      })
      .mockReturnValueOnce(originAsset)
      .mockReturnValueOnce(originAsset)
      .mockReturnValueOnce(originAsset)

    vi.mocked(findAssetInfoOnDest)
      .mockReturnValueOnce({ symbol: 'DOT' } as TAssetInfo)
      .mockReturnValueOnce({ symbol: 'DOT' } as TAssetInfo)
      .mockReturnValueOnce({ symbol: 'DOT' } as TAssetInfo)

    const result = getSupportedDestinations(origin, currency)

    expect(result).toEqual(['Acala', 'Moonbeam', 'Astar'])
  })

  it('should re-throw non-InvalidCurrencyError errors from findAssetInfoOrThrow', () => {
    const origin = 'Polkadot'
    const currency = { symbol: 'DOT' }
    const originAsset = {
      symbol: 'DOT'
    } as TAssetInfo

    vi.mocked(findAssetInfoOrThrow)
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
    } as TAssetInfo

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(originAsset)
    vi.mocked(findAssetInfoOnDest).mockImplementationOnce(() => {
      throw new Error('Some other error')
    })

    expect(() => getSupportedDestinations(origin, currency)).toThrow('Some other error')
  })

  it('should propagate errors from initial findAssetInfoOrThrow call', () => {
    const origin = 'Polkadot'
    const currency = { symbol: 'DOT' }

    vi.mocked(findAssetInfoOrThrow).mockImplementationOnce(() => {
      throw new Error('Asset not found for origin')
    })

    expect(() => getSupportedDestinations(origin, currency)).toThrow('Asset not found for origin')
  })

  it('should return empty array when no destinations support the asset', () => {
    const origin = 'Polkadot'
    const currency = { symbol: 'RARE_TOKEN' }
    const originAsset = {
      symbol: 'RARE_TOKEN'
    } as TAssetInfo

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(originAsset)
    vi.mocked(findAssetInfoOnDest).mockReturnValue(null)

    const result = getSupportedDestinations(origin, currency)

    expect(result).toEqual([])
  })
})
