import {
  findNativeAssetInfoOrThrow,
  hasSupportForAsset,
  InvalidCurrencyError,
  isAssetEqual,
  type TAssetInfo
} from '@paraspell/assets'
import { isExternalChain, isRelayChain, isTLocation, Parents } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { throwUnsupportedCurrency } from '../../pallets/xcmPallet/utils'
import type { TDestination, TSendOptions } from '../../types'
import { getRelayChainOf } from '../../utils'
import { validateAssetSupport } from './validateAssetSupport'

vi.mock('@paraspell/sdk-common', async importOriginal => ({
  ...(await importOriginal()),
  isExternalChain: vi.fn(),
  isRelayChain: vi.fn(),
  isTLocation: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  findNativeAssetInfoOrThrow: vi.fn(),
  hasSupportForAsset: vi.fn(),
  InvalidCurrencyError: class extends Error {},
  isAssetEqual: vi.fn()
}))

vi.mock('../../pallets/xcmPallet/utils')

vi.mock('../../utils', async importOriginal => ({
  ...(await importOriginal()),
  getRelayChainOf: vi.fn()
}))

describe('validateAssetSupport', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(isRelayChain).mockReturnValue(false)
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(isExternalChain).mockReturnValue(false)
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'NATIVE' } as TAssetInfo)
    vi.mocked(isAssetEqual).mockReturnValue(false)
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

    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue(asset)
    vi.mocked(isAssetEqual).mockReturnValue(true)

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
    expect(throwUnsupportedCurrency).not.toHaveBeenCalled()
  })

  it('should not throw when bridged asset matches target relay consensus', () => {
    const options = {
      from: 'Astar',
      to: 'Acala',
      currency: { symbol: 'BRIDGED' }
    } as TSendOptions<unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = true
    const asset = {
      symbol: 'BRIDGED',
      location: {
        parents: Parents.TWO,
        interior: {
          X2: [{ GlobalConsensus: { polkadot: null } }, { Parachain: 2000 }]
        }
      }
    } as unknown as TAssetInfo

    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'NATIVE' } as TAssetInfo)
    vi.mocked(isAssetEqual).mockReturnValue(false)

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
    expect(throwUnsupportedCurrency).not.toHaveBeenCalled()
  })

  it('should throw when bridge asset is neither native nor bridged', () => {
    const options = {
      from: 'Astar',
      to: 'Acala',
      currency: { symbol: 'FOREIGN' }
    } as TSendOptions<unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = true
    const asset = {
      symbol: 'FOREIGN',
      location: {
        parents: Parents.ONE,
        interior: {
          X1: [{ PalletInstance: 50 }]
        }
      }
    } as unknown as TAssetInfo

    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'NATIVE' } as TAssetInfo)
    vi.mocked(isAssetEqual).mockReturnValue(false)

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).toThrow(
      InvalidCurrencyError
    )
    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).toThrow(
      'Substrate bridge does not support currency {"symbol":"FOREIGN"}.'
    )
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

  it('should call throwUnsupportedCurrency when isBridge is true and asset is null', () => {
    const options = {
      from: 'Astar',
      to: 'Acala',
      currency: { symbol: 'UNKNOWN' }
    } as TSendOptions<unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = true
    const asset = null

    validateAssetSupport(options, assetCheckEnabled, isBridge, asset)

    expect(throwUnsupportedCurrency).toHaveBeenCalledWith(options.currency, options.from)
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

    vi.mocked(isRelayChain).mockReturnValueOnce(true)

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
