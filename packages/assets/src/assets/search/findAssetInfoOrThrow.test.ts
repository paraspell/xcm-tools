import type { TNodeWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidCurrencyError } from '../../errors'
import type { TAssetInfo, TCurrencyInput } from '../../types'
import { findAssetInfo } from './findAssetInfo'
import { findAssetInfoOrThrow } from './findAssetInfoOrThrow'

vi.mock('./findAssetInfo', () => ({
  findAssetInfo: vi.fn()
}))

describe('findAssetForNodeOrThrow', () => {
  const mockAsset = {
    symbol: 'DOT',
    decimals: 10
  } as TAssetInfo

  const mockCurrencyObject: TCurrencyInput = { symbol: 'KSM' }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should return the asset if findAsset finds it directly', () => {
    const node: TNodeWithRelayChains = 'Polkadot'
    const destination: TNodeWithRelayChains = 'Moonbeam'
    vi.mocked(findAssetInfo).mockReturnValue(mockAsset)

    const result = findAssetInfoOrThrow(node, mockCurrencyObject, destination)

    expect(result).toEqual(mockAsset)
    expect(findAssetInfo).toHaveBeenCalledTimes(1)
    expect(findAssetInfo).toHaveBeenCalledWith(node, mockCurrencyObject, destination)
  })

  it('should return the asset from Ethereum fallback if node is AssetHubPolkadot and primary findAsset fails', () => {
    const node: TNodeWithRelayChains = 'AssetHubPolkadot'
    const destination: TNodeWithRelayChains = 'Astar'
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

    const result = findAssetInfoOrThrow(node, mockCurrencyObject, destination)

    expect(result).toEqual(ethereumAsset)
    expect(findAssetInfo).toHaveBeenCalledTimes(2)
    expect(findAssetInfo).toHaveBeenNthCalledWith(1, node, mockCurrencyObject, destination)
    expect(findAssetInfo).toHaveBeenNthCalledWith(2, 'Ethereum', mockCurrencyObject, null)
  })

  it('should throw InvalidCurrencyError if node is AssetHubPolkadot and both primary and Ethereum fallback fail', () => {
    const node: TNodeWithRelayChains = 'AssetHubPolkadot'
    const destination: TNodeWithRelayChains | null = null
    vi.mocked(findAssetInfo).mockReturnValue(null)

    const currencyInput: TCurrencyInput = { id: 'NON_EXISTENT_ID' }

    expect(() => findAssetInfoOrThrow(node, currencyInput, destination)).toThrow(
      `Asset ${JSON.stringify(currencyInput)} not found on ${node}`
    )
    expect(findAssetInfo).toHaveBeenCalledTimes(2)
    expect(findAssetInfo).toHaveBeenNthCalledWith(1, node, currencyInput, destination)
    expect(findAssetInfo).toHaveBeenNthCalledWith(2, 'Ethereum', currencyInput, null)
  })

  it('should throw InvalidCurrencyError if node is not AssetHubPolkadot and findAsset fails', () => {
    const node: TNodeWithRelayChains = 'Moonbeam'
    const destination: TNodeWithRelayChains = 'Polkadot'
    vi.mocked(findAssetInfo).mockReturnValue(null)

    const currencyInput: TCurrencyInput = { symbol: 'XYZ' }

    expect(() => findAssetInfoOrThrow(node, currencyInput, destination)).toThrow(
      InvalidCurrencyError
    )
    expect(findAssetInfo).toHaveBeenCalledTimes(1)
    expect(findAssetInfo).toHaveBeenCalledWith(node, currencyInput, destination)
  })

  it('should throw InvalidCurrencyError with correct message for symbol currency input', () => {
    const node: TNodeWithRelayChains = 'Acala'
    vi.mocked(findAssetInfo).mockReturnValue(null)

    const currencyInput: TCurrencyInput = { symbol: 'ACA' }

    expect(() => findAssetInfoOrThrow(node, currencyInput, null)).toThrow()
  })

  it('should throw InvalidCurrencyError with correct message for object currency input', () => {
    const node: TNodeWithRelayChains = 'Karura'
    vi.mocked(findAssetInfo).mockReturnValue(null)

    const currencyInput: TCurrencyInput = { symbol: '0x0001' }

    expect(() => findAssetInfoOrThrow(node, currencyInput, null)).toThrow(
      `Asset ${JSON.stringify(currencyInput)} not found on ${node}`
    )
  })
})
