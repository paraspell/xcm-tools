import type { TNodeWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidCurrencyError } from '../../errors'
import type { TAsset, TCurrencyInput } from '../../types'
import { findAsset } from './findAsset'
import { findAssetForNodeOrThrow } from './findAssetForNodeOrThrow'

vi.mock('./findAsset', () => ({
  findAsset: vi.fn()
}))

describe('findAssetForNodeOrThrow', () => {
  const mockAsset = {
    symbol: 'DOT',
    decimals: 10
  } as TAsset

  const mockCurrencyObject: TCurrencyInput = { symbol: 'KSM' }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should return the asset if findAsset finds it directly', () => {
    const node: TNodeWithRelayChains = 'Polkadot'
    const destination: TNodeWithRelayChains = 'Moonbeam'
    vi.mocked(findAsset).mockReturnValue(mockAsset)

    const result = findAssetForNodeOrThrow(node, mockCurrencyObject, destination)

    expect(result).toEqual(mockAsset)
    expect(findAsset).toHaveBeenCalledTimes(1)
    expect(findAsset).toHaveBeenCalledWith(node, mockCurrencyObject, destination)
  })

  it('should return the asset from Ethereum fallback if node is AssetHubPolkadot and primary findAsset fails', () => {
    const node: TNodeWithRelayChains = 'AssetHubPolkadot'
    const destination: TNodeWithRelayChains = 'Astar'
    const ethereumAsset: TAsset = { symbol: 'USDT', decimals: 6, assetId: 'USDT_ETH' }

    vi.mocked(findAsset)
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

    const result = findAssetForNodeOrThrow(node, mockCurrencyObject, destination)

    expect(result).toEqual(ethereumAsset)
    expect(findAsset).toHaveBeenCalledTimes(2)
    expect(findAsset).toHaveBeenNthCalledWith(1, node, mockCurrencyObject, destination)
    expect(findAsset).toHaveBeenNthCalledWith(2, 'Ethereum', mockCurrencyObject, null)
  })

  it('should throw InvalidCurrencyError if node is AssetHubPolkadot and both primary and Ethereum fallback fail', () => {
    const node: TNodeWithRelayChains = 'AssetHubPolkadot'
    const destination: TNodeWithRelayChains | null = null
    vi.mocked(findAsset).mockReturnValue(null)

    const currencyInput: TCurrencyInput = { id: 'NON_EXISTENT_ID' }

    expect(() => findAssetForNodeOrThrow(node, currencyInput, destination)).toThrow(
      `Asset ${JSON.stringify(currencyInput)} not found on ${node}`
    )
    expect(findAsset).toHaveBeenCalledTimes(2)
    expect(findAsset).toHaveBeenNthCalledWith(1, node, currencyInput, destination)
    expect(findAsset).toHaveBeenNthCalledWith(2, 'Ethereum', currencyInput, null)
  })

  it('should throw InvalidCurrencyError if node is not AssetHubPolkadot and findAsset fails', () => {
    const node: TNodeWithRelayChains = 'Moonbeam'
    const destination: TNodeWithRelayChains = 'Polkadot'
    vi.mocked(findAsset).mockReturnValue(null)

    const currencyInput: TCurrencyInput = { symbol: 'XYZ' }

    expect(() => findAssetForNodeOrThrow(node, currencyInput, destination)).toThrow(
      InvalidCurrencyError
    )
    expect(findAsset).toHaveBeenCalledTimes(1)
    expect(findAsset).toHaveBeenCalledWith(node, currencyInput, destination)
  })

  it('should throw InvalidCurrencyError with correct message for symbol currency input', () => {
    const node: TNodeWithRelayChains = 'Acala'
    vi.mocked(findAsset).mockReturnValue(null)

    const currencyInput: TCurrencyInput = { symbol: 'ACA' }

    expect(() => findAssetForNodeOrThrow(node, currencyInput, null)).toThrow()
  })

  it('should throw InvalidCurrencyError with correct message for object currency input', () => {
    const node: TNodeWithRelayChains = 'Karura'
    vi.mocked(findAsset).mockReturnValue(null)

    const currencyInput: TCurrencyInput = { symbol: '0x0001' }

    expect(() => findAssetForNodeOrThrow(node, currencyInput, null)).toThrow(
      `Asset ${JSON.stringify(currencyInput)} not found on ${node}`
    )
  })
})
