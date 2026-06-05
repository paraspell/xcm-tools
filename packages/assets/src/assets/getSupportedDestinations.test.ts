import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DuplicateAssetError, InvalidCurrencyError } from '../errors'
import type { TAssetInfo } from '../types'
import { getRelayChainSymbol } from './assets'
import { getSupportedDestinations } from './getSupportedDestinations'
import { isAssetEqual } from './isAssetEqual'
import { isStableCoinAsset } from './isStableCoinAsset'
import { isSystemAsset } from './isSystemAsset'
import { findAssetInfoOnDest, findAssetInfoOrThrow, findNativeAssetInfoOrThrow } from './search'

const { isExternalChainMock, isSubstrateBridgeMock } = vi.hoisted(() => ({
  isExternalChainMock: vi.fn((_chain: string) => false),
  isSubstrateBridgeMock: vi.fn((_origin: string, _destination: string) => false)
}))

vi.mock('./search')

vi.mock('./assets', () => ({
  getRelayChainSymbol: vi.fn(() => 'DOT')
}))

vi.mock('./isAssetEqual', () => ({
  isAssetEqual: vi.fn()
}))

vi.mock('./isSystemAsset', () => ({
  isSystemAsset: vi.fn(() => false)
}))

vi.mock('./isStableCoinAsset', () => ({
  isStableCoinAsset: vi.fn(() => false)
}))

vi.mock('@paraspell/sdk-common', () => ({
  CHAINS: ['Polkadot', 'Kusama', 'Acala', 'Moonbeam', 'Astar', 'AssetHubPolkadot'],
  SUBSTRATE_CHAINS: ['Polkadot', 'BifrostPolkadot', 'Acala', 'Astar', 'Karura'],
  ETHEREUM_BRIDGE_ORIGINS: ['Acala'],
  isExternalChain: isExternalChainMock,
  isSubstrateBridge: isSubstrateBridgeMock
}))

describe('getSupportedDestinations', () => {
  const origin = 'Polkadot'
  const currency = { symbol: 'DOT' }
  const asset = { symbol: 'DOT' } as TAssetInfo
  const nativeSymbols: Record<string, string> = {
    Polkadot: 'DOT',
    BifrostPolkadot: 'BNC',
    Acala: 'ACA',
    Astar: 'ASTR'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRelayChainSymbol).mockImplementation(chain => (chain === 'Karura' ? 'KSM' : 'DOT'))
    vi.mocked(findNativeAssetInfoOrThrow).mockImplementation(
      chain => ({ symbol: nativeSymbols[chain] ?? chain }) as TAssetInfo
    )
    vi.mocked(isAssetEqual).mockImplementation((a, b) => a.symbol === b.symbol)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue(asset)
    vi.mocked(findAssetInfoOnDest).mockReturnValue(asset)
    isExternalChainMock.mockReturnValue(false)
    isSubstrateBridgeMock.mockReturnValue(false)
    vi.mocked(isSystemAsset).mockReturnValue(false)
    vi.mocked(isStableCoinAsset).mockReturnValue(false)
  })

  it('should return destinations where the asset resolves on the destination', () => {
    vi.mocked(findAssetInfoOnDest)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(asset)
      .mockReturnValueOnce(asset)
      .mockReturnValueOnce(null)

    const result = getSupportedDestinations(origin, currency)

    expect(findAssetInfoOnDest).toHaveBeenCalledTimes(4)
    expect(findAssetInfoOnDest).toHaveBeenCalledWith(origin, 'Kusama', currency, asset)
    expect(result).toEqual(['Acala', 'Moonbeam'])
  })

  it('should exclude the origin chain from results', () => {
    const result = getSupportedDestinations(origin, currency)

    expect(result).not.toContain(origin)
    expect(findAssetInfoOnDest).toHaveBeenCalledTimes(4)
  })

  it('should include a destination when DuplicateAssetError is thrown', () => {
    vi.mocked(findAssetInfoOnDest)
      .mockImplementationOnce(() => {
        throw new DuplicateAssetError('Multiple assets found')
      })
      .mockReturnValueOnce(asset)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null)

    expect(getSupportedDestinations(origin, currency)).toEqual(['Kusama', 'Acala'])
  })

  it('should exclude a destination when InvalidCurrencyError is thrown from findAssetInfoOrThrow', () => {
    vi.mocked(findAssetInfoOrThrow)
      .mockReturnValueOnce(asset)
      .mockImplementationOnce(() => {
        throw new InvalidCurrencyError('Invalid currency for destination')
      })

    expect(getSupportedDestinations(origin, currency)).toEqual(['Acala', 'Moonbeam', 'Astar'])
  })

  it('should re-throw non-InvalidCurrencyError errors from findAssetInfoOrThrow', () => {
    vi.mocked(findAssetInfoOrThrow)
      .mockReturnValueOnce(asset)
      .mockImplementationOnce(() => {
        throw new Error('Some other error')
      })

    expect(() => getSupportedDestinations(origin, currency)).toThrow('Some other error')
  })

  it('should re-throw non-DuplicateAssetError errors from findAssetInfoOnDest', () => {
    vi.mocked(findAssetInfoOnDest).mockImplementationOnce(() => {
      throw new Error('Some other error')
    })

    expect(() => getSupportedDestinations(origin, currency)).toThrow('Some other error')
  })

  it('should propagate errors from the initial findAssetInfoOrThrow call', () => {
    vi.mocked(findAssetInfoOrThrow).mockImplementationOnce(() => {
      throw new Error('Asset not found for origin')
    })

    expect(() => getSupportedDestinations(origin, currency)).toThrow('Asset not found for origin')
  })

  it('should exclude destinations that are not reachable', () => {
    vi.mocked(getRelayChainSymbol).mockImplementation(chain => (chain === 'Kusama' ? 'KSM' : 'DOT'))

    const result = getSupportedDestinations(origin, currency)

    expect(result).not.toContain('Kusama')
    expect(findAssetInfoOnDest).not.toHaveBeenCalledWith(origin, 'Kusama', currency, asset)
  })

  it('should gate external (Snowbridge) destinations by ETHEREUM_BRIDGE_ORIGINS', () => {
    isExternalChainMock.mockImplementation(chain => chain === 'Kusama')

    expect(getSupportedDestinations('Acala', currency)).toContain('Kusama')
    expect(getSupportedDestinations('Moonbeam', currency)).not.toContain('Kusama')
  })

  it('should handle external origins (reverse Snowbridge) and exclude external-to-external', () => {
    isExternalChainMock.mockImplementation(chain => chain === 'Ethereum')
    const reverse = getSupportedDestinations('Ethereum', currency)
    expect(reverse).toContain('Acala')
    expect(reverse).not.toContain('Moonbeam')

    isExternalChainMock.mockReturnValue(true)
    expect(getSupportedDestinations('Ethereum', currency)).toEqual([])
  })

  it('should restrict Substrate-bridge destinations to bridge-supported assets', () => {
    isSubstrateBridgeMock.mockImplementation((_origin, destination) => destination === 'Kusama')

    vi.mocked(isSystemAsset).mockReturnValue(true)
    expect(getSupportedDestinations(origin, currency)).toContain('Kusama')

    vi.mocked(isSystemAsset).mockReturnValue(false)
    vi.mocked(isStableCoinAsset).mockReturnValue(true)
    expect(getSupportedDestinations(origin, currency)).toContain('Kusama')

    vi.mocked(isStableCoinAsset).mockReturnValue(false)
    expect(getSupportedDestinations(origin, currency)).not.toContain('Kusama')
  })

  it('should not return an AssetHub destination for the origin chain native asset', () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'BNC' } as TAssetInfo)

    expect(getSupportedDestinations('BifrostPolkadot', { symbol: 'BNC' })).not.toContain(
      'AssetHubPolkadot'
    )
  })

  it('should not return parachain destinations from an AssetHub for any chain native asset', () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'BNC' } as TAssetInfo)

    const result = getSupportedDestinations('AssetHubPolkadot', { symbol: 'BNC' })
    expect(result).not.toContain('Astar')
    expect(result).not.toContain('Acala')
  })

  it('should still allow non-native and system assets to cross to/from AssetHubs', () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'USDC' } as TAssetInfo)
    expect(getSupportedDestinations('Acala', currency)).toContain('AssetHubPolkadot')

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(isSystemAsset).mockReturnValue(true)
    expect(getSupportedDestinations('Acala', currency)).toContain('AssetHubPolkadot')
  })

  it('should only consider native assets within the origin ecosystem', () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'KAR' } as TAssetInfo)

    expect(getSupportedDestinations('AssetHubPolkadot', { symbol: 'KAR' })).toContain('Astar')
  })

  it('should return an empty array when no destinations support the asset', () => {
    vi.mocked(findAssetInfoOnDest).mockReturnValue(null)

    expect(getSupportedDestinations(origin, currency)).toEqual([])
  })
})
