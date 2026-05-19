import type { TAssetInfo, TCurrencyInput } from '@paraspell/assets'
import { isTLocation, type TSubstrateChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import type { TDestination } from '../../types'
import { resolveAsset } from './resolveAsset'

vi.mock('@paraspell/sdk-common', () => ({
  isTLocation: vi.fn()
}))

describe('resolveAsset', () => {
  const findAssetInfo = vi.fn()
  const apiMock = { findAssetInfo } as unknown as PolkadotApi<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return null when assetCheckEnabled is false', () => {
    const currency = {} as TCurrencyInput
    const origin: TSubstrateChain = 'Acala'
    const destination: TDestination = 'Astar'
    const assetCheckEnabled = false

    const result = resolveAsset(currency, origin, destination, assetCheckEnabled, apiMock)

    expect(result).toBeNull()
    expect(findAssetInfo).not.toHaveBeenCalled()
  })

  it('should call findAssetInfo with destination when destination is defined and !isTLocation(destination) is true', () => {
    const currency = {} as TCurrencyInput
    const origin: TSubstrateChain = 'Acala'
    const destination: TDestination = 'Astar'
    const assetCheckEnabled = true
    const asset = {} as TAssetInfo

    vi.mocked(isTLocation).mockReturnValue(false)
    findAssetInfo.mockReturnValue(asset)

    const result = resolveAsset(currency, origin, destination, assetCheckEnabled, apiMock)

    expect(isTLocation).toHaveBeenCalledWith(destination)
    expect(findAssetInfo).toHaveBeenCalledWith(origin, currency, destination)
    expect(result).toBe(asset)
  })

  it('should call findAssetInfo with null when destination is defined and !isTLocation(destination) is false', () => {
    const currency = {} as TCurrencyInput
    const origin: TSubstrateChain = 'Acala'
    const destination: TDestination = 'Astar'
    const assetCheckEnabled = true

    const asset = {} as TAssetInfo

    vi.mocked(isTLocation).mockReturnValue(true)
    findAssetInfo.mockReturnValue(asset)

    const result = resolveAsset(currency, origin, destination, assetCheckEnabled, apiMock)

    expect(isTLocation).toHaveBeenCalledWith(destination)
    expect(findAssetInfo).toHaveBeenCalledWith(origin, currency, null)
    expect(result).toBe(asset)
  })
})
