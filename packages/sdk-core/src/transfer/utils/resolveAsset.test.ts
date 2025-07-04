import type { TAsset } from '@paraspell/assets'
import { findAsset, type TCurrencyInput } from '@paraspell/assets'
import { isTMultiLocation, type TNodePolkadotKusama } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TDestination } from '../../types'
import { getRelayChainOf } from '../../utils'
import { resolveAsset } from './resolveAsset'

vi.mock('@paraspell/assets', () => ({
  findAsset: vi.fn()
}))

vi.mock('../../utils', () => ({
  getRelayChainOf: vi.fn()
}))

vi.mock('@paraspell/sdk-common', () => ({
  isTMultiLocation: vi.fn()
}))

describe('resolveAsset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return null when assetCheckEnabled is false', () => {
    const currency = {} as TCurrencyInput
    const origin = 'Acala' as TNodePolkadotKusama
    const destination: TDestination = 'Astar'
    const assetCheckEnabled = false

    const result = resolveAsset(currency, origin, destination, assetCheckEnabled)

    expect(result).toBeNull()
    expect(findAsset).not.toHaveBeenCalled()
  })

  it('should call getAssetBySymbolOrId with gerRelayChainOf(origin) when destination is undefined', () => {
    const currency = {} as TCurrencyInput
    const origin = 'Acala' as TNodePolkadotKusama
    const destination: TDestination = 'Polkadot'
    const assetCheckEnabled = true
    const asset = {} as TAsset

    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(findAsset).mockReturnValue(asset)

    const result = resolveAsset(currency, origin, destination, assetCheckEnabled)

    expect(findAsset).toHaveBeenCalledWith(origin, currency, 'Polkadot')
    expect(result).toBe(asset)
  })

  it('should call getAssetBySymbolOrId with destination when destination is defined and !isTMultiLocation(destination) is true', () => {
    const currency = {} as TCurrencyInput
    const origin = 'Acala' as TNodePolkadotKusama
    const destination: TDestination = 'Astar'
    const assetCheckEnabled = true
    const asset = {} as TAsset

    vi.mocked(isTMultiLocation).mockReturnValue(false)
    vi.mocked(findAsset).mockReturnValue(asset)

    const result = resolveAsset(currency, origin, destination, assetCheckEnabled)

    expect(isTMultiLocation).toHaveBeenCalledWith(destination)
    expect(getRelayChainOf).not.toHaveBeenCalled()
    expect(findAsset).toHaveBeenCalledWith(origin, currency, destination)
    expect(result).toBe(asset)
  })

  it('should call getAssetBySymbolOrId with null when destination is defined and !isTMultiLocation(destination) is false', () => {
    const currency = {} as TCurrencyInput
    const origin = 'Acala' as TNodePolkadotKusama
    const destination: TDestination = 'Astar'
    const assetCheckEnabled = true

    const asset = {} as TAsset

    vi.mocked(isTMultiLocation).mockReturnValue(true)
    vi.mocked(findAsset).mockReturnValue(asset)

    const result = resolveAsset(currency, origin, destination, assetCheckEnabled)

    expect(isTMultiLocation).toHaveBeenCalledWith(destination)
    expect(getRelayChainOf).not.toHaveBeenCalled()
    expect(findAsset).toHaveBeenCalledWith(origin, currency, null)
    expect(result).toBe(asset)
  })
})
