import type { TChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidCurrencyError } from '../../errors'
import type { TAssetInfo, TCurrencyInput } from '../../types'
import { findAssetInfoImpl } from './findAssetInfo'
import { findAssetInfoOrThrow } from './findAssetInfoOrThrow'

vi.mock('./findAssetInfo', () => ({
  findAssetInfoImpl: vi.fn()
}))

describe('findAssetInfoOrThrow', () => {
  const mockAsset = {
    symbol: 'DOT',
    decimals: 10
  } as TAssetInfo

  const mockCurrencyObject: TCurrencyInput = { symbol: 'KSM' }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should return the asset if findAsset finds it directly', () => {
    const chain: TChain = 'Polkadot'
    const destination: TChain = 'Moonbeam'
    vi.mocked(findAssetInfoImpl).mockReturnValue(mockAsset)

    const result = findAssetInfoOrThrow(chain, mockCurrencyObject, destination)

    expect(result).toEqual(mockAsset)
    expect(findAssetInfoImpl).toHaveBeenCalledTimes(1)
    expect(findAssetInfoImpl).toHaveBeenCalledWith(
      chain,
      mockCurrencyObject,
      destination,
      undefined
    )
  })

  it('should return the asset from Ethereum fallback if chain is AssetHubPolkadot and primary findAsset fails', () => {
    const chain: TChain = 'AssetHubPolkadot'
    const destination: TChain = 'Astar'
    const ethereumAsset: TAssetInfo = {
      symbol: 'USDT',
      decimals: 6,
      assetId: 'USDT_ETH',
      location: { parents: 2, interior: 'Here' }
    }

    vi.mocked(findAssetInfoImpl).mockImplementationOnce((n, c, d) => {
      if (n === 'AssetHubPolkadot' && c === mockCurrencyObject && d === destination) {
        return ethereumAsset
      }
      return null
    })

    const result = findAssetInfoOrThrow(chain, mockCurrencyObject, destination)

    expect(result).toEqual(ethereumAsset)
    expect(findAssetInfoImpl).toHaveBeenCalledTimes(1)
    expect(findAssetInfoImpl).toHaveBeenNthCalledWith(
      1,
      chain,
      mockCurrencyObject,
      destination,
      undefined
    )
  })

  it('should throw InvalidCurrencyError if chain is AssetHubPolkadot and both primary and Ethereum fallback fail', () => {
    const chain: TChain = 'AssetHubPolkadot'
    const destination: TChain | null = null
    vi.mocked(findAssetInfoImpl).mockReturnValue(null)

    const currencyInput: TCurrencyInput = { id: 'NON_EXISTENT_ID' }

    expect(() => findAssetInfoOrThrow(chain, currencyInput, destination)).toThrow(
      `Asset ${JSON.stringify(currencyInput)} not found on ${chain}`
    )
    expect(findAssetInfoImpl).toHaveBeenCalledTimes(1)
    expect(findAssetInfoImpl).toHaveBeenNthCalledWith(
      1,
      chain,
      currencyInput,
      destination,
      undefined
    )
  })

  it('should throw InvalidCurrencyError if chain is not AssetHubPolkadot and findAsset fails', () => {
    const chain: TChain = 'Moonbeam'
    const destination: TChain = 'Polkadot'
    vi.mocked(findAssetInfoImpl).mockReturnValue(null)

    const currencyInput: TCurrencyInput = { symbol: 'XYZ' }

    expect(() => findAssetInfoOrThrow(chain, currencyInput, destination)).toThrow(
      InvalidCurrencyError
    )
    expect(findAssetInfoImpl).toHaveBeenCalledTimes(1)
    expect(findAssetInfoImpl).toHaveBeenCalledWith(chain, currencyInput, destination, undefined)
  })

  it('should throw InvalidCurrencyError with correct message for symbol currency input', () => {
    const chain: TChain = 'Acala'
    vi.mocked(findAssetInfoImpl).mockReturnValue(null)

    const currencyInput: TCurrencyInput = { symbol: 'ACA' }

    expect(() => findAssetInfoOrThrow(chain, currencyInput)).toThrow()
  })

  it('should throw InvalidCurrencyError with correct message for object currency input', () => {
    const chain: TChain = 'Karura'
    vi.mocked(findAssetInfoImpl).mockReturnValue(null)

    const currencyInput: TCurrencyInput = { symbol: '0x0001' }

    expect(() => findAssetInfoOrThrow(chain, currencyInput)).toThrow(
      `Asset ${JSON.stringify(currencyInput)} not found on ${chain}`
    )
  })
})
