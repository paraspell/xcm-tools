import type { TChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidCurrencyError } from '../../errors'
import type { TAssetInfo, TCurrencyInput } from '../../types'
import { findAssetInfo } from './findAssetInfo'
import { findAssetInfoOrThrow } from './findAssetInfoOrThrow'

vi.mock('./findAssetInfo', () => ({
  findAssetInfo: vi.fn()
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
    vi.mocked(findAssetInfo).mockReturnValue(mockAsset)

    const result = findAssetInfoOrThrow(chain, mockCurrencyObject, destination)

    expect(result).toEqual(mockAsset)
    expect(findAssetInfo).toHaveBeenCalledTimes(1)
    expect(findAssetInfo).toHaveBeenCalledWith(chain, mockCurrencyObject, destination)
  })

  it('should return the asset from Ethereum fallback if chain is AssetHubPolkadot and primary findAsset fails', () => {
    const chain: TChain = 'AssetHubPolkadot'
    const destination: TChain = 'Astar'
    const ethereumAsset: TAssetInfo = { symbol: 'USDT', decimals: 6, assetId: 'USDT_ETH' }

    vi.mocked(findAssetInfo)
      .mockImplementationOnce((n, c, d) => {
        if (n === 'AssetHubPolkadot' && c === mockCurrencyObject && d === destination) {
          return null
        }
        return null
      })
      .mockImplementationOnce((n, c, d) => {
        if (n === 'Ethereum' && c === mockCurrencyObject && d === null) {
          return ethereumAsset
        }
        return null
      })

    const result = findAssetInfoOrThrow(chain, mockCurrencyObject, destination)

    expect(result).toEqual(ethereumAsset)
    expect(findAssetInfo).toHaveBeenCalledTimes(2)
    expect(findAssetInfo).toHaveBeenNthCalledWith(1, chain, mockCurrencyObject, destination)
    expect(findAssetInfo).toHaveBeenNthCalledWith(2, 'Ethereum', mockCurrencyObject, null)
  })

  it('should throw InvalidCurrencyError if chain is AssetHubPolkadot and both primary and Ethereum fallback fail', () => {
    const chain: TChain = 'AssetHubPolkadot'
    const destination: TChain | null = null
    vi.mocked(findAssetInfo).mockReturnValue(null)

    const currencyInput: TCurrencyInput = { id: 'NON_EXISTENT_ID' }

    expect(() => findAssetInfoOrThrow(chain, currencyInput, destination)).toThrow(
      `Asset ${JSON.stringify(currencyInput)} not found on ${chain}`
    )
    expect(findAssetInfo).toHaveBeenCalledTimes(2)
    expect(findAssetInfo).toHaveBeenNthCalledWith(1, chain, currencyInput, destination)
    expect(findAssetInfo).toHaveBeenNthCalledWith(2, 'Ethereum', currencyInput, null)
  })

  it('should throw InvalidCurrencyError if chain is not AssetHubPolkadot and findAsset fails', () => {
    const chain: TChain = 'Moonbeam'
    const destination: TChain = 'Polkadot'
    vi.mocked(findAssetInfo).mockReturnValue(null)

    const currencyInput: TCurrencyInput = { symbol: 'XYZ' }

    expect(() => findAssetInfoOrThrow(chain, currencyInput, destination)).toThrow(
      InvalidCurrencyError
    )
    expect(findAssetInfo).toHaveBeenCalledTimes(1)
    expect(findAssetInfo).toHaveBeenCalledWith(chain, currencyInput, destination)
  })

  it('should throw InvalidCurrencyError with correct message for symbol currency input', () => {
    const chain: TChain = 'Acala'
    vi.mocked(findAssetInfo).mockReturnValue(null)

    const currencyInput: TCurrencyInput = { symbol: 'ACA' }

    expect(() => findAssetInfoOrThrow(chain, currencyInput, null)).toThrow()
  })

  it('should throw InvalidCurrencyError with correct message for object currency input', () => {
    const chain: TChain = 'Karura'
    vi.mocked(findAssetInfo).mockReturnValue(null)

    const currencyInput: TCurrencyInput = { symbol: '0x0001' }

    expect(() => findAssetInfoOrThrow(chain, currencyInput, null)).toThrow(
      `Asset ${JSON.stringify(currencyInput)} not found on ${chain}`
    )
  })
})
