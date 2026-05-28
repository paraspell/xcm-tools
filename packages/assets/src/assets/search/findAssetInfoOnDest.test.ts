import type { TChain, TLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidCurrencyError } from '../../errors'
import type { TAssetInfo, TCurrencyInput, TCustomCtx } from '../../types'
import { Foreign, Native } from '../assetSelectors'
import { isStableCoinAsset } from '../isStableCoinAsset'
import { findAssetInfoImpl } from './findAssetInfo'
import {
  findAssetInfoOnDest,
  findAssetInfoOnDestImpl,
  findAssetOnDestOrThrow,
  findAssetOnDestOrThrowImpl
} from './findAssetInfoOnDest'
import { findAssetInfoOrThrowImpl } from './findAssetInfoOrThrow'
import { findStablecoinAssets } from './findStablecoinAssets'

vi.mock('./findAssetInfo')
vi.mock('./findAssetInfoOrThrow')
vi.mock('./findStablecoinAssets')
vi.mock('../isStableCoinAsset')

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

const mockDestinationAsset: TAssetInfo = {
  symbol: mockAssetSymbol,
  assetId: '2',
  decimals: 12,
  location: mockLocation
}

const mockStablecoinAsset: TAssetInfo = {
  symbol: 'USDx',
  assetId: '999',
  decimals: 12,
  location: {
    parents: 1,
    interior: {
      X2: [{ PalletInstance: 50 }, { GeneralIndex: 1984 }]
    }
  }
}

describe('findAssetOnDest', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(isStableCoinAsset).mockReturnValue(false)
    vi.mocked(findStablecoinAssets).mockReturnValue([])
  })

  it('should find asset on destination by location if origin asset has location and asset is found', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfoOrThrowImpl).mockReturnValueOnce(mockOriginAssetWithLocation)
    vi.mocked(findAssetInfoImpl).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetInfoOnDest(mockOriginChain, mockDestinationChain, currencyInput)

    expect(findAssetInfoOrThrowImpl).toHaveBeenCalledWith(
      mockOriginChain,
      currencyInput,
      mockDestinationChain,
      undefined
    )
    expect(findAssetInfoImpl).toHaveBeenCalledWith(
      mockDestinationChain,
      { location: mockLocation },
      null,
      undefined
    )
    expect(result).toEqual(mockDestinationAsset)
    expect(findAssetInfoOrThrowImpl).toHaveBeenCalledTimes(1)
  })

  it('should lookup native asset first for substrate bridge (AssetHubPolkadot -> AssetHubKusama)', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfoOrThrowImpl).mockReturnValueOnce(mockOriginAssetWithLocation)
    vi.mocked(findAssetInfoImpl).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetInfoOnDest('AssetHubPolkadot', 'AssetHubKusama', currencyInput)

    expect(findAssetInfoOrThrowImpl).toHaveBeenCalledWith(
      'AssetHubPolkadot',
      currencyInput,
      'AssetHubKusama',
      undefined
    )
    expect(findAssetInfoImpl).toHaveBeenCalledWith(
      'AssetHubKusama',
      { symbol: Native(mockOriginAssetWithLocation.symbol) },
      null,
      undefined
    )
    expect(result).toEqual(mockDestinationAsset)
    expect(findAssetInfoImpl).toHaveBeenCalledTimes(1)
  })

  it('should return stablecoin match when native is missing on substrate bridge', () => {
    const currencyInput: TCurrencyInput = { symbol: mockStablecoinAsset.symbol }

    vi.mocked(findAssetInfoOrThrowImpl).mockReturnValueOnce({
      ...mockStablecoinAsset,
      assetId: 'origin-stable'
    })

    vi.mocked(isStableCoinAsset).mockReturnValue(true)

    vi.mocked(findAssetInfoImpl)
      .mockReturnValueOnce(null) // native lookup
      .mockReturnValueOnce(null) // foreign lookup

    vi.mocked(findStablecoinAssets).mockReturnValueOnce([mockStablecoinAsset])

    const result = findAssetInfoOnDest('AssetHubPolkadot', 'AssetHubKusama', currencyInput)

    expect(findStablecoinAssets).toHaveBeenCalledWith('AssetHubKusama')
    expect(result).toEqual(mockStablecoinAsset)
    expect(findAssetInfoImpl).toHaveBeenCalledTimes(1)
  })

  it('should fall back to foreign selector when native asset is missing on substrate bridge', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfoOrThrowImpl).mockReturnValueOnce(mockOriginAssetWithLocation)
    vi.mocked(findAssetInfoImpl).mockReturnValueOnce(null).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetInfoOnDest('AssetHubPolkadot', 'AssetHubKusama', currencyInput)

    expect(findAssetInfoImpl).toHaveBeenNthCalledWith(
      1,
      'AssetHubKusama',
      { symbol: Native(mockOriginAssetWithLocation.symbol) },
      null,
      undefined
    )
    expect(findAssetInfoImpl).toHaveBeenNthCalledWith(
      2,
      'AssetHubKusama',
      { symbol: Foreign(mockOriginAssetWithLocation.symbol) },
      null,
      undefined
    )
    expect(result).toEqual(mockDestinationAsset)
  })

  it('should return null when substrate bridge asset is missing for both native and foreign selectors', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfoOrThrowImpl).mockReturnValueOnce(mockOriginAssetWithLocation)
    vi.mocked(findAssetInfoImpl).mockReturnValueOnce(null).mockReturnValueOnce(null)

    const result = findAssetInfoOnDest('AssetHubKusama', 'AssetHubPolkadot', currencyInput)

    expect(findAssetInfoImpl).toHaveBeenCalledWith(
      'AssetHubPolkadot',
      { symbol: Native(mockOriginAssetWithLocation.symbol) },
      null,
      undefined
    )
    expect(findAssetInfoImpl).toHaveBeenCalledWith(
      'AssetHubPolkadot',
      { symbol: Foreign(mockOriginAssetWithLocation.symbol) },
      null,
      undefined
    )
    expect(result).toBeNull()
    expect(findAssetInfoImpl).toHaveBeenCalledTimes(2)
  })

  it('should return null if asset is not found on destination', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfoOrThrowImpl).mockReturnValueOnce(mockOriginAssetWithLocation)
    vi.mocked(findAssetInfoImpl).mockReturnValueOnce(null).mockReturnValueOnce(null)

    const result = findAssetInfoOnDest(mockOriginChain, mockDestinationChain, currencyInput)

    expect(result).toBeNull()
    expect(findAssetInfoImpl).toHaveBeenCalledTimes(1)
  })

  it('should throw error if findAssetInfoOrThrowImpl throws an error', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }
    const expectedError = new Error('Asset not found on origin')

    vi.mocked(findAssetInfoOrThrowImpl).mockImplementationOnce(() => {
      throw expectedError
    })

    expect(() => findAssetInfoOnDest(mockOriginChain, mockDestinationChain, currencyInput)).toThrow(
      expectedError
    )
    expect(findAssetInfoOrThrowImpl).toHaveBeenCalledWith(
      mockOriginChain,
      currencyInput,
      mockDestinationChain,
      undefined
    )
    expect(findAssetInfoImpl).not.toHaveBeenCalled()
  })

  it('should find asset by symbol on Snowbridge destination when origin asset is a system asset', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    const systemAsset: TAssetInfo = {
      symbol: mockAssetSymbol,
      assetId: '1',
      decimals: 10,
      location: { parents: 1, interior: { Here: null } }
    }

    vi.mocked(findAssetInfoOrThrowImpl).mockReturnValueOnce(systemAsset)
    vi.mocked(findAssetInfoImpl).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetInfoOnDest('AssetHubPolkadot', 'Ethereum', currencyInput)

    expect(findAssetInfoImpl).toHaveBeenCalledWith(
      'Ethereum',
      { symbol: mockAssetSymbol },
      null,
      undefined
    )
    expect(result).toEqual(mockDestinationAsset)
  })

  it('should find MYTH by symbol on Ethereum when origin is Mythos', () => {
    const currencyInput: TCurrencyInput = { symbol: 'MYTH' }

    const mythosNative: TAssetInfo = {
      symbol: 'MYTH',
      isNative: true,
      decimals: 18,
      location: { parents: 1, interior: { X1: [{ Parachain: 3369 }] } }
    }
    const ethereumMyth: TAssetInfo = {
      symbol: 'MYTH',
      assetId: '0xba41ddf06b7ffd89d1267b5a93bfef2424eb2003',
      decimals: 18,
      location: {
        parents: 2,
        interior: {
          X2: [
            { GlobalConsensus: { Ethereum: { chainId: 1n } } },
            {
              AccountKey20: {
                network: null,
                key: '0xba41ddf06b7ffd89d1267b5a93bfef2424eb2003'
              }
            }
          ]
        }
      }
    }

    vi.mocked(findAssetInfoOrThrowImpl).mockReturnValueOnce(mythosNative)
    vi.mocked(findAssetInfoImpl).mockReturnValueOnce(ethereumMyth)

    const result = findAssetInfoOnDest('Mythos', 'Ethereum', currencyInput)

    expect(findAssetInfoImpl).toHaveBeenCalledWith('Ethereum', { symbol: 'MYTH' }, null, undefined)
    expect(result).toEqual(ethereumMyth)
  })

  it('should use provided origin asset instead of resolving when available', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfoImpl).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetInfoOnDest(
      mockOriginChain,
      mockDestinationChain,
      currencyInput,
      mockOriginAssetWithLocation
    )

    expect(findAssetInfoOrThrowImpl).not.toHaveBeenCalled()
    expect(findAssetInfoImpl).toHaveBeenCalledWith(
      mockDestinationChain,
      { location: mockLocation },
      null,
      undefined
    )
    expect(result).toEqual(mockDestinationAsset)
  })
})

describe('findAssetOnDestOrThrow', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(isStableCoinAsset).mockReturnValue(false)
    vi.mocked(findStablecoinAssets).mockReturnValue([])
  })

  it('should return asset when findAssetOnDest returns an asset', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfoOrThrowImpl).mockReturnValueOnce(mockOriginAssetWithLocation)
    vi.mocked(findAssetInfoImpl).mockReturnValueOnce(mockDestinationAsset)

    const result = findAssetOnDestOrThrow(mockOriginChain, mockDestinationChain, currencyInput)

    expect(result).toEqual(mockDestinationAsset)
  })

  it('should throw InvalidCurrencyError when findAssetOnDest returns null', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }

    vi.mocked(findAssetInfoOrThrowImpl).mockReturnValueOnce(mockOriginAssetWithLocation)
    vi.mocked(findAssetInfoImpl).mockReturnValueOnce(null).mockReturnValueOnce(null)

    expect(() =>
      findAssetOnDestOrThrow(mockOriginChain, mockDestinationChain, currencyInput)
    ).toThrow(InvalidCurrencyError)
  })

  it('should propagate errors from findAssetOnDest', () => {
    const currencyInput: TCurrencyInput = { symbol: mockAssetSymbol }
    const expectedError = new Error('Asset not found on origin')

    vi.mocked(findAssetInfoOrThrowImpl).mockImplementationOnce(() => {
      throw expectedError
    })

    expect(() =>
      findAssetOnDestOrThrow(mockOriginChain, mockDestinationChain, currencyInput)
    ).toThrow(expectedError)
  })
})

describe('custom asset auto-mirror on destination', () => {
  const customLocation: TLocation = {
    parents: 0,
    interior: { X2: [{ PalletInstance: 50 }, { GeneralIndex: '9999' }] }
  }
  const customAsset: TAssetInfo = {
    symbol: 'MYNEWUSD',
    decimals: 6,
    assetId: '9999',
    location: customLocation
  }
  const customCtx: TCustomCtx = {
    customAssets: { AssetHubPolkadot: [customAsset] }
  }

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(isStableCoinAsset).mockReturnValue(false)
    vi.mocked(findStablecoinAssets).mockReturnValue([])
  })

  it('mirrors origin custom asset onto destination when destination has no match', () => {
    vi.mocked(findAssetInfoImpl).mockReturnValueOnce(null)

    const result = findAssetInfoOnDestImpl(
      'AssetHubPolkadot',
      'Hydration',
      { symbol: 'MYNEWUSD' },
      customAsset,
      customCtx
    )

    expect(result).toEqual(customAsset)
  })

  it('prefers registry destination asset over mirrored custom asset when location matches', () => {
    const registryDest: TAssetInfo = { ...customAsset, assetId: 'dest-id' }
    vi.mocked(findAssetInfoImpl).mockReturnValueOnce(registryDest)

    const result = findAssetInfoOnDestImpl(
      'AssetHubPolkadot',
      'Hydration',
      { symbol: 'MYNEWUSD' },
      customAsset,
      customCtx
    )

    expect(result).toEqual(registryDest)
  })

  it('does not mirror when origin asset is not custom', () => {
    vi.mocked(findAssetInfoImpl).mockReturnValueOnce(null)

    const result = findAssetInfoOnDestImpl(
      'AssetHubPolkadot',
      'Hydration',
      { symbol: 'MYNEWUSD' },
      customAsset,
      { customAssets: { Acala: [customAsset] } }
    )

    expect(result).toBeNull()
  })

  it('does not mirror when ctx is undefined', () => {
    vi.mocked(findAssetInfoImpl).mockReturnValueOnce(null)

    const result = findAssetInfoOnDestImpl(
      'AssetHubPolkadot',
      'Hydration',
      { symbol: 'MYNEWUSD' },
      customAsset
    )

    expect(result).toBeNull()
  })

  it('mirrors origin custom asset across Snowbridge when destination has no match', () => {
    vi.mocked(findAssetInfoImpl).mockReturnValueOnce(null)

    const result = findAssetInfoOnDestImpl(
      'AssetHubPolkadot',
      'Ethereum',
      { symbol: 'MYNEWUSD' },
      customAsset,
      customCtx
    )

    expect(result).toEqual(customAsset)
  })

  it('findAssetOnDestOrThrowImpl returns mirrored custom asset instead of throwing', () => {
    vi.mocked(findAssetInfoOrThrowImpl).mockReturnValueOnce(customAsset)
    vi.mocked(findAssetInfoImpl).mockReturnValueOnce(null)

    const result = findAssetOnDestOrThrowImpl(
      'AssetHubPolkadot',
      'Hydration',
      { symbol: 'MYNEWUSD' },
      customCtx
    )

    expect(result).toEqual(customAsset)
  })
})
