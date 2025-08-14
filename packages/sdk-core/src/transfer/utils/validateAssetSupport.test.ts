import type { TNativeAssetInfo } from '@paraspell/assets'
import {
  getNativeAssets,
  hasSupportForAsset,
  InvalidCurrencyError,
  type TAssetInfo
} from '@paraspell/assets'
import { isRelayChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TransferToAhNotSupported } from '../../errors'
import { throwUnsupportedCurrency } from '../../pallets/xcmPallet/utils'
import type { TDestination, TSendOptions } from '../../types'
import { validateAssetSupport } from './validateAssetSupport'

vi.mock('@paraspell/sdk-common', async importOriginal => ({
  ...(await importOriginal()),
  isRelayChain: vi.fn(),
  isTLocation: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  getNativeAssets: vi.fn(),
  hasSupportForAsset: vi.fn(),
  InvalidCurrencyError: class extends Error {}
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  throwUnsupportedCurrency: vi.fn()
}))

describe('validateAssetSupport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw InvalidCurrencyError when trying to send DOT to AssetHub from not allowed chains', () => {
    const options = {
      from: 'Acala',
      to: 'AssetHubPolkadot',
      currency: { symbol: 'DOT' }
    } as TSendOptions<unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'DOT' } as TAssetInfo

    vi.mocked(getNativeAssets).mockReturnValue([{ symbol: 'DOT', isNative: true, decimals: 10 }])

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).toThrow(
      TransferToAhNotSupported
    )
    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).toThrow(
      'Chain Acala does not support DOT transfer to AssetHub'
    )
  })

  it('should not throw when isBridge is true', () => {
    const options = {
      from: 'Acala',
      to: 'AssetHubPolkadot',
      currency: { symbol: 'TEST' }
    } as TSendOptions<unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = true
    const asset = { symbol: 'TEST' } as TAssetInfo

    vi.mocked(getNativeAssets).mockReturnValue([{ symbol: 'TEST' } as TNativeAssetInfo])

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should not throw when destination is not AssetHub', () => {
    const options = {
      from: 'Acala',
      to: 'Astar',
      currency: { symbol: 'TEST' }
    } as TSendOptions<unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'TEST' } as TAssetInfo

    vi.mocked(hasSupportForAsset).mockReturnValue(true)

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should not throw when origin is Bifrost', () => {
    const options = {
      from: 'BifrostPolkadot',
      to: 'AssetHubPolkadot',
      currency: { symbol: 'TEST' }
    } as TSendOptions<unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'TEST' } as TAssetInfo

    vi.mocked(hasSupportForAsset).mockReturnValue(true)

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should filter out DOT from native assets when origin is Hydration', () => {
    const options = {
      from: 'Hydration',
      to: 'AssetHubPolkadot',
      currency: { symbol: 'DOT' }
    } as TSendOptions<unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'DOT' } as TAssetInfo

    vi.mocked(hasSupportForAsset).mockReturnValue(true)
    vi.mocked(getNativeAssets).mockReturnValue([
      { symbol: 'DOT', isNative: true, decimals: 10 },
      { symbol: 'KSM', isNative: true, decimals: 12 }
    ])

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should throw InvalidCurrencyError when destination does not support asset', () => {
    const options = {
      from: 'Acala',
      to: 'Astar',
      currency: { symbol: 'UNSUPPORTED' }
    } as TSendOptions<unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'UNSUPPORTED' } as TAssetInfo

    vi.mocked(hasSupportForAsset).mockReturnValue(false)
    vi.mocked(isRelayChain).mockReturnValue(false)

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).toThrow(
      InvalidCurrencyError
    )
    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).toThrow(
      'Destination chain Astar does not support currency {"symbol":"UNSUPPORTED"}.'
    )
  })

  it('should not throw when destination supports asset', () => {
    const options = {
      from: 'Acala',
      to: 'Astar',
      currency: { symbol: 'SUPPORTED' }
    } as TSendOptions<unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'SUPPORTED' } as TAssetInfo

    vi.mocked(hasSupportForAsset).mockReturnValue(true)

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should not throw when assetCheckEnabled is false', () => {
    const options = {
      from: 'Acala',
      to: 'Astar',
      currency: { symbol: 'ANY' }
    } as TSendOptions<unknown, unknown>

    const assetCheckEnabled = false
    const isBridge = false
    const asset = null

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should call throwUnsupportedCurrency when asset is null and assetCheckEnabled is true', () => {
    const options = {
      from: 'Acala',
      to: 'Astar',
      currency: { symbol: 'UNKNOWN' }
    } as TSendOptions<unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = null

    validateAssetSupport(options, assetCheckEnabled, isBridge, asset)

    expect(throwUnsupportedCurrency).toHaveBeenCalledWith(options.currency, options.from)
  })

  it('should not call throwUnsupportedCurrency when isBridge is true', () => {
    const options = {
      from: 'Astar',
      to: 'Acala',
      currency: { symbol: 'UNKNOWN' }
    } as TSendOptions<unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = true
    const asset = null

    validateAssetSupport(options, assetCheckEnabled, isBridge, asset)

    expect(throwUnsupportedCurrency).not.toHaveBeenCalled()
  })

  it('should not throw when destination is relay (undefined)', () => {
    const options = {
      from: 'Acala',
      to: 'Polkadot',
      currency: { symbol: 'TEST' }
    } as TSendOptions<unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'TEST' } as TAssetInfo

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should not throw when destination is a location object', () => {
    const options = {
      from: 'Acala',
      to: {} as TDestination,
      currency: { symbol: 'TEST' }
    } as TSendOptions<unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'TEST' } as TAssetInfo

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should not throw when currency has id', () => {
    const options = {
      from: 'Astar',
      to: 'Acala',
      currency: { id: 'some-id' }
    } as TSendOptions<unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'TEST' } as TAssetInfo

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })
})
