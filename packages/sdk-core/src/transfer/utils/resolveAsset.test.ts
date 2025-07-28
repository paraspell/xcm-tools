import type { TAssetInfo } from '@paraspell/assets'
import { findAssetInfo, type TCurrencyInput } from '@paraspell/assets'
import { isTLocation, type TNodePolkadotKusama } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TDestination } from '../../types'
import { getRelayChainOf } from '../../utils'
import { resolveAsset } from './resolveAsset'

vi.mock('@paraspell/assets', () => ({
  findAssetInfo: vi.fn()
}))

vi.mock('../../utils', () => ({
  getRelayChainOf: vi.fn()
}))

vi.mock('@paraspell/sdk-common', () => ({
  isTLocation: vi.fn()
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
    expect(findAssetInfo).not.toHaveBeenCalled()
  })

  it('should call getAssetBySymbolOrId with gerRelayChainOf(origin) when destination is undefined', () => {
    const currency = {} as TCurrencyInput
    const origin = 'Acala' as TNodePolkadotKusama
    const destination: TDestination = 'Polkadot'
    const assetCheckEnabled = true
    const asset = {} as TAssetInfo

    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(findAssetInfo).mockReturnValue(asset)

    const result = resolveAsset(currency, origin, destination, assetCheckEnabled)

    expect(findAssetInfo).toHaveBeenCalledWith(origin, currency, 'Polkadot')
    expect(result).toBe(asset)
  })

  it('should call getAssetBySymbolOrId with destination when destination is defined and !isTLocation(destination) is true', () => {
    const currency = {} as TCurrencyInput
    const origin = 'Acala' as TNodePolkadotKusama
    const destination: TDestination = 'Astar'
    const assetCheckEnabled = true
    const asset = {} as TAssetInfo

    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(findAssetInfo).mockReturnValue(asset)

    const result = resolveAsset(currency, origin, destination, assetCheckEnabled)

    expect(isTLocation).toHaveBeenCalledWith(destination)
    expect(getRelayChainOf).not.toHaveBeenCalled()
    expect(findAssetInfo).toHaveBeenCalledWith(origin, currency, destination)
    expect(result).toBe(asset)
  })

  it('should call getAssetBySymbolOrId with null when destination is defined and !isTLocation(destination) is false', () => {
    const currency = {} as TCurrencyInput
    const origin = 'Acala' as TNodePolkadotKusama
    const destination: TDestination = 'Astar'
    const assetCheckEnabled = true

    const asset = {} as TAssetInfo

    vi.mocked(isTLocation).mockReturnValue(true)
    vi.mocked(findAssetInfo).mockReturnValue(asset)

    const result = resolveAsset(currency, origin, destination, assetCheckEnabled)

    expect(isTLocation).toHaveBeenCalledWith(destination)
    expect(getRelayChainOf).not.toHaveBeenCalled()
    expect(findAssetInfo).toHaveBeenCalledWith(origin, currency, null)
    expect(result).toBe(asset)
  })
})
