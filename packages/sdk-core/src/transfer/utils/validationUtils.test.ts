import type { MockInstance } from 'vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { IncompatibleNodesError, InvalidCurrencyError } from '../../errors'
import { getNativeAssets, getRelayChainSymbol, hasSupportForAsset } from '../../pallets/assets'
import { getDefaultPallet } from '../../pallets/pallets'
import { isTMultiLocation, throwUnsupportedCurrency } from '../../pallets/xcmPallet/utils'
import type {
  TAsset,
  TCurrencyInput,
  TDestination,
  TNativeAsset,
  TNodeDotKsmWithRelayChains,
  TNodePolkadotKusama,
  TSendOptions
} from '../../types'
import { isRelayChain } from '../../utils'
import { isSymbolSpecifier } from '../../utils/assets/isSymbolSpecifier'
import { isBridgeTransfer } from './isBridgeTransfer'
import {
  validateAssetSpecifiers,
  validateAssetSupport,
  validateCurrency,
  validateDestination
} from './validationUtils'

vi.mock('./isBridgeTransfer', () => ({
  isBridgeTransfer: vi.fn()
}))

vi.mock('../../utils/assets/isSymbolSpecifier', () => ({
  isSymbolSpecifier: vi.fn()
}))

vi.mock('../../pallets/pallets', () => ({
  getDefaultPallet: vi.fn()
}))

vi.mock('../../pallets/assets', () => ({
  getRelayChainSymbol: vi.fn(),
  getNativeAssets: vi.fn(),
  hasSupportForAsset: vi.fn()
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  throwUnsupportedCurrency: vi.fn(),
  isTMultiLocation: vi.fn()
}))

vi.mock('../../utils', () => ({
  isRelayChain: vi.fn()
}))

describe('validateCurrency', () => {
  let consoleWarnSpy: MockInstance

  beforeEach(() => {
    vi.resetAllMocks()
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  it('should throw InvalidCurrencyError when currency.multiasset is empty', () => {
    const currency = { multiasset: [] } as TCurrencyInput

    expect(() => validateCurrency(currency)).toThrow(InvalidCurrencyError)
    expect(() => validateCurrency(currency)).toThrow('Overridden multi assets cannot be empty')
  })

  it('should throw InvalidCurrencyError when currency.multiasset has length 1 and feeAsset is specified', () => {
    const currency = { multiasset: [{ symbol: 'DOT' }] } as TCurrencyInput

    expect(() => validateCurrency(currency, { symbol: 'DOT' })).toThrow(InvalidCurrencyError)
    expect(() => validateCurrency(currency)).toThrow('Please provide more than one multi asset')
  })

  it('should throw InvalidCurrencyError when currency.multiasset has length >1 and feeAsset is undefined', () => {
    const currency = { multiasset: [{}, {}] } as TCurrencyInput

    expect(() => validateCurrency(currency)).toThrow(InvalidCurrencyError)
    expect(() => validateCurrency(currency)).toThrow(
      'Overridden multi assets cannot be used without specifying fee asset'
    )
  })

  it('should not throw when currency has multiasset with length >1 and valid feeAsset index', () => {
    const currency = { multiasset: [{}, {}] } as TCurrencyInput

    expect(() => validateCurrency(currency, { symbol: 'DOT' })).not.toThrow()
  })

  it('should throw when currency has multiasset with length 1 or less', () => {
    const currency = { multiasset: [{}] } as TCurrencyInput

    expect(() => validateCurrency(currency)).toThrow('Please provide more than one multi asset')
  })
})

describe('validateDestination', () => {
  let origin: TNodeDotKsmWithRelayChains
  let destination: TDestination

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw IncompatibleNodesError when destination is Ethereum and origin is not AssetHubPolkadot or Hydration', () => {
    origin = 'Acala'
    destination = 'Ethereum'

    expect(() => validateDestination(origin, destination)).toThrow(IncompatibleNodesError)
    expect(() => validateDestination(origin, destination)).toThrow(
      'Transfers to Ethereum are only supported from AssetHubPolkadot and Hydration.'
    )
  })

  it('should not throw when destination is Ethereum and origin is AssetHubPolkadot', () => {
    origin = 'AssetHubPolkadot'
    destination = 'Ethereum'

    expect(() => validateDestination(origin, destination)).not.toThrow()
  })

  it('should not throw when destination is Ethereum and origin is Hydration', () => {
    origin = 'Hydration'
    destination = 'Ethereum'

    expect(() => validateDestination(origin, destination)).not.toThrow()
  })

  it('should not throw when destination is undefined (relay destination)', () => {
    origin = 'AssetHubPolkadot'
    destination = 'Polkadot'

    expect(() => validateDestination(origin, destination)).not.toThrow()
  })

  it('should not throw when destination is a MultiLocation object', () => {
    origin = 'AssetHubPolkadot'
    destination = {} as TDestination

    expect(() => validateDestination(origin, destination)).not.toThrow()
  })

  it('should throw IncompatibleNodesError when relay chain symbols do not match and not a bridge transfer', () => {
    origin = 'Acala'
    destination = 'Astar'

    vi.mocked(isBridgeTransfer).mockReturnValue(false)
    vi.mocked(getRelayChainSymbol).mockReturnValueOnce('DOT').mockReturnValueOnce('KSM')

    expect(() => validateDestination(origin, destination)).toThrow(IncompatibleNodesError)
  })

  it('should not throw when relay chain symbols match and not a bridge transfer', () => {
    origin = 'Acala'
    destination = 'Astar'

    vi.mocked(isBridgeTransfer).mockReturnValue(false)
    vi.mocked(getRelayChainSymbol).mockReturnValueOnce('DOT').mockReturnValueOnce('DOT')

    expect(() => validateDestination(origin, destination)).not.toThrow()
  })

  it('should not throw when it is a bridge transfer regardless of relay chain symbols', () => {
    origin = 'Acala'
    destination = 'Astar'

    vi.mocked(isBridgeTransfer).mockReturnValue(true)
    vi.mocked(getRelayChainSymbol).mockReturnValueOnce('DOT').mockReturnValueOnce('KSM')

    expect(() => validateDestination(origin, destination)).not.toThrow()
  })

  it('should not throw when destination is a MultiLocation object and other conditions are met', () => {
    origin = 'Acala'
    destination = {} as TDestination

    vi.mocked(isBridgeTransfer).mockReturnValue(false)
    // Relay chain symbols should not be fetched in this case

    expect(() => validateDestination(origin, destination)).not.toThrow()
    expect(vi.mocked(getRelayChainSymbol)).not.toHaveBeenCalled()
  })

  it('should throw IncompatibleNodesError when origin is undefined and destination is Ethereum', () => {
    origin = undefined as unknown as TNodePolkadotKusama
    destination = 'Ethereum'

    expect(() => validateDestination(origin, destination)).toThrow(IncompatibleNodesError)
    expect(() => validateDestination(origin, destination)).toThrow(
      'Transfers to Ethereum are only supported from AssetHubPolkadot and Hydration.'
    )
  })

  it('should not throw when origin and destination relay chain symbols match even if destination is undefined', () => {
    origin = 'Acala'
    destination = 'Polkadot'

    vi.mocked(isBridgeTransfer).mockReturnValue(false)
    vi.mocked(isRelayChain).mockImplementation(node => node === destination)

    expect(() => validateDestination(origin, destination)).not.toThrow()
    expect(vi.mocked(getRelayChainSymbol)).not.toHaveBeenCalled()
  })

  it('should throw when origin and destination are relay chains', () => {
    origin = 'Polkadot'
    destination = 'Kusama'

    vi.mocked(isRelayChain).mockReturnValue(true)
    vi.mocked(isTMultiLocation).mockReturnValue(false)

    expect(() => validateDestination(origin, destination)).toThrow()
    expect(isRelayChain).toHaveBeenCalled()
  })
})

describe('validateAssetSpecifiers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw InvalidCurrencyError when assetCheckEnabled is false, currency has symbol, and isSymbolSpecifier returns true', () => {
    const assetCheckEnabled = false
    const currency: TCurrencyInput = { symbol: 'symbol-value' }
    vi.mocked(isSymbolSpecifier).mockReturnValue(true)

    expect(() => validateAssetSpecifiers(assetCheckEnabled, currency)).toThrow(InvalidCurrencyError)
    expect(() => validateAssetSpecifiers(assetCheckEnabled, currency)).toThrow(
      'Symbol specifier is not supported when asset check is disabled. Please use normal symbol instead.'
    )
    expect(isSymbolSpecifier).toHaveBeenCalledWith('symbol-value')
  })

  it('should throw InvalidCurrencyError when assetCheckEnabled is false, and currency has id', () => {
    const assetCheckEnabled = false
    const currency: TCurrencyInput = { id: 'id-value' }

    expect(() => validateAssetSpecifiers(assetCheckEnabled, currency)).toThrow(InvalidCurrencyError)
    expect(() => validateAssetSpecifiers(assetCheckEnabled, currency)).toThrow(
      'Asset ID is not supported when asset check is disabled. Please use normal symbol instead'
    )
  })

  it('should not throw when assetCheckEnabled is false, currency has symbol, but isSymbolSpecifier returns false', () => {
    const assetCheckEnabled = false
    const currency: TCurrencyInput = { symbol: 'symbol-value' }
    vi.mocked(isSymbolSpecifier).mockReturnValue(false)

    expect(() => validateAssetSpecifiers(assetCheckEnabled, currency)).not.toThrow()
    expect(isSymbolSpecifier).toHaveBeenCalledWith('symbol-value')
  })

  it('should not throw when assetCheckEnabled is true, regardless of currency', () => {
    const assetCheckEnabled = true
    const currency1: TCurrencyInput = { symbol: 'symbol-value' }
    const currency2: TCurrencyInput = { id: 'id-value' }
    vi.mocked(isSymbolSpecifier).mockReturnValue(true)

    expect(() => validateAssetSpecifiers(assetCheckEnabled, currency1)).not.toThrow()
    expect(() => validateAssetSpecifiers(assetCheckEnabled, currency2)).not.toThrow()
  })

  it('should not throw when assetCheckEnabled is false and currency has neither symbol nor id', () => {
    const assetCheckEnabled = false
    const currency = {} as TCurrencyInput

    expect(() => validateAssetSpecifiers(assetCheckEnabled, currency)).not.toThrow()
  })
})

describe('validateAssetSupport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw InvalidCurrencyError when asset symbol matches native asset in destination', () => {
    const options = {
      from: 'Acala',
      to: 'AssetHubPolkadot',
      currency: { symbol: 'TEST' }
    } as TSendOptions<unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'TEST' } as TAsset

    vi.mocked(getDefaultPallet).mockReturnValue('XTokens')
    vi.mocked(getNativeAssets).mockReturnValue([{ symbol: 'TEST', isNative: true }])

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).toThrow(
      InvalidCurrencyError
    )
    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).toThrow(
      '"TEST" is not supported for transfers to AssetHubPolkadot.'
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
    const asset = { symbol: 'TEST' } as TAsset

    vi.mocked(getDefaultPallet).mockReturnValue('XTokens')
    vi.mocked(getNativeAssets).mockReturnValue([{ symbol: 'TEST' } as TNativeAsset])

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
    const asset = { symbol: 'TEST' } as TAsset

    vi.mocked(hasSupportForAsset).mockReturnValue(true)
    vi.mocked(getDefaultPallet).mockReturnValue('XTokens')

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should not throw when pallet is not XTokens', () => {
    const options = {
      from: 'Acala',
      to: 'AssetHubPolkadot',
      currency: { symbol: 'TEST' }
    } as TSendOptions<unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'TEST' } as TAsset

    vi.mocked(hasSupportForAsset).mockReturnValue(true)
    vi.mocked(getDefaultPallet).mockReturnValue('PolkadotXcm')

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
    const asset = { symbol: 'TEST' } as TAsset

    vi.mocked(hasSupportForAsset).mockReturnValue(true)
    vi.mocked(getDefaultPallet).mockReturnValue('XTokens')

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
    const asset = { symbol: 'DOT' } as TAsset

    vi.mocked(getDefaultPallet).mockReturnValue('XTokens')
    vi.mocked(hasSupportForAsset).mockReturnValue(true)
    vi.mocked(getNativeAssets).mockReturnValue([
      { symbol: 'DOT', isNative: true },
      { symbol: 'KSM', isNative: true }
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
    const asset = { symbol: 'UNSUPPORTED' } as TAsset

    vi.mocked(hasSupportForAsset).mockReturnValue(false)
    vi.mocked(isRelayChain).mockReturnValue(false)

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).toThrow(
      InvalidCurrencyError
    )
    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).toThrow(
      'Destination node Astar does not support currency {"symbol":"UNSUPPORTED"}.'
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
    const asset = { symbol: 'SUPPORTED' } as TAsset

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
    const asset = { symbol: 'TEST' } as TAsset

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should not throw when destination is a MultiLocation object', () => {
    const options = {
      from: 'Acala',
      to: {} as TDestination,
      currency: { symbol: 'TEST' }
    } as TSendOptions<unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'TEST' } as TAsset

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
    const asset = { symbol: 'TEST' } as TAsset

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })
})
