import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAssetBySymbolOrId } from '../../pallets/assets/getAssetBySymbolOrId'
import { isTMultiLocation } from '../../pallets/xcmPallet/utils'
import type { TAsset, TCurrencyInput, TDestination, TNodePolkadotKusama } from '../../types'
import { determineRelayChain } from '../../utils'
import { resolveAsset } from './resolveAsset'

vi.mock('../../pallets/assets/getAssetBySymbolOrId', () => ({
  getAssetBySymbolOrId: vi.fn()
}))

vi.mock('../../utils', () => ({
  determineRelayChain: vi.fn()
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
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
    expect(getAssetBySymbolOrId).not.toHaveBeenCalled()
  })

  it('should call getAssetBySymbolOrId with determineRelayChain(origin) when destination is undefined', () => {
    const currency = {} as TCurrencyInput
    const origin = 'Acala' as TNodePolkadotKusama
    const destination: TDestination = 'Polkadot'
    const assetCheckEnabled = true
    const asset = {} as TAsset

    vi.mocked(determineRelayChain).mockReturnValue('Polkadot')
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(asset)

    const result = resolveAsset(currency, origin, destination, assetCheckEnabled)

    expect(getAssetBySymbolOrId).toHaveBeenCalledWith(origin, currency, 'Polkadot')
    expect(result).toBe(asset)
  })

  it('should call getAssetBySymbolOrId with destination when destination is defined and !isTMultiLocation(destination) is true', () => {
    const currency = {} as TCurrencyInput
    const origin = 'Acala' as TNodePolkadotKusama
    const destination: TDestination = 'Astar'
    const assetCheckEnabled = true
    const asset = {} as TAsset

    vi.mocked(isTMultiLocation).mockReturnValue(false)
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(asset)

    const result = resolveAsset(currency, origin, destination, assetCheckEnabled)

    expect(isTMultiLocation).toHaveBeenCalledWith(destination)
    expect(determineRelayChain).not.toHaveBeenCalled()
    expect(getAssetBySymbolOrId).toHaveBeenCalledWith(origin, currency, destination)
    expect(result).toBe(asset)
  })

  it('should call getAssetBySymbolOrId with null when destination is defined and !isTMultiLocation(destination) is false', () => {
    const currency = {} as TCurrencyInput
    const origin = 'Acala' as TNodePolkadotKusama
    const destination: TDestination = 'Astar'
    const assetCheckEnabled = true

    const asset = {} as TAsset

    vi.mocked(isTMultiLocation).mockReturnValue(true)
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(asset)

    const result = resolveAsset(currency, origin, destination, assetCheckEnabled)

    expect(isTMultiLocation).toHaveBeenCalledWith(destination)
    expect(determineRelayChain).not.toHaveBeenCalled()
    expect(getAssetBySymbolOrId).toHaveBeenCalledWith(origin, currency, null)
    expect(result).toBe(asset)
  })
})
