import {
  getRelayChainSymbol,
  InvalidCurrencyError,
  isSymbolSpecifier,
  type TCurrencyInput
} from '@paraspell/assets'
import {
  isDotKsmBridge,
  isRelayChain,
  isTLocation,
  type TNodeDotKsmWithRelayChains,
  type TNodePolkadotKusama
} from '@paraspell/sdk-common'
import type { MockInstance } from 'vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { IncompatibleNodesError } from '../../errors'
import type { TDestination } from '../../types'
import { validateAssetSpecifiers, validateCurrency, validateDestination } from './validationUtils'

vi.mock('@paraspell/pallets', () => ({
  getDefaultPallet: vi.fn()
}))

vi.mock('@paraspell/sdk-common', () => ({
  isTLocation: vi.fn(),
  isRelayChain: vi.fn(),
  isDotKsmBridge: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  getRelayChainSymbol: vi.fn(),
  getNativeAssets: vi.fn(),
  hasSupportForAsset: vi.fn(),
  InvalidCurrencyError: class extends Error {},
  isSymbolSpecifier: vi.fn(),
  isTAsset: vi.fn()
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  throwUnsupportedCurrency: vi.fn()
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
    expect(() => validateCurrency(currency)).toThrow('Overridden assets cannot be empty')
  })

  it('should throw InvalidCurrencyError when currency.multiasset has length 1 and feeAsset is specified', () => {
    const currency = { multiasset: [{ symbol: 'DOT' }] } as TCurrencyInput

    expect(() => validateCurrency(currency, { symbol: 'DOT' })).toThrow(InvalidCurrencyError)
    expect(() => validateCurrency(currency)).toThrow('Please provide more than one asset')
  })

  it('should throw InvalidCurrencyError when currency.multiasset has length >1 and feeAsset is undefined', () => {
    const currency = { multiasset: [{}, {}] } as TCurrencyInput

    expect(() => validateCurrency(currency)).toThrow(InvalidCurrencyError)
    expect(() => validateCurrency(currency)).toThrow(
      'Overridden assets cannot be used without specifying fee asset'
    )
  })

  it('should not throw when currency has multiasset with length >1 and valid feeAsset', () => {
    const currency = { multiasset: [{}, {}] } as TCurrencyInput

    expect(() => validateCurrency(currency, { symbol: 'DOT' })).not.toThrow()
  })

  it('should throw when currency has multiasset with length 1 or less', () => {
    const currency = { multiasset: [{}] } as TCurrencyInput

    expect(() => validateCurrency(currency)).toThrow('Please provide more than one asset')
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

  it('should not throw when destination is a Location object', () => {
    origin = 'AssetHubPolkadot'
    destination = {} as TDestination

    expect(() => validateDestination(origin, destination)).not.toThrow()
  })

  it('should throw IncompatibleNodesError when relay chain symbols do not match and not a bridge transfer', () => {
    origin = 'Acala'
    destination = 'Astar'

    vi.mocked(isDotKsmBridge).mockReturnValue(false)
    vi.mocked(getRelayChainSymbol).mockReturnValueOnce('DOT').mockReturnValueOnce('KSM')

    expect(() => validateDestination(origin, destination)).toThrow(IncompatibleNodesError)
  })

  it('should not throw when relay chain symbols match and not a bridge transfer', () => {
    origin = 'Acala'
    destination = 'Astar'

    vi.mocked(isDotKsmBridge).mockReturnValue(false)
    vi.mocked(getRelayChainSymbol).mockReturnValueOnce('DOT').mockReturnValueOnce('DOT')

    expect(() => validateDestination(origin, destination)).not.toThrow()
  })

  it('should not throw when it is a bridge transfer regardless of relay chain symbols', () => {
    origin = 'Acala'
    destination = 'Astar'

    vi.mocked(isDotKsmBridge).mockReturnValue(true)
    vi.mocked(getRelayChainSymbol).mockReturnValueOnce('DOT').mockReturnValueOnce('KSM')

    expect(() => validateDestination(origin, destination)).not.toThrow()
  })

  it('should not throw when destination is a location object and other conditions are met', () => {
    origin = 'Acala'
    destination = {} as TDestination

    vi.mocked(isDotKsmBridge).mockReturnValue(false)
    // Relay chain symbols should not be fetched in this case

    expect(() => validateDestination(origin, destination)).not.toThrow()
    expect(getRelayChainSymbol).not.toHaveBeenCalled()
  })

  it('should throw IncompatibleNodesError when origin is undefined and destination is Ethereum', () => {
    origin = undefined as unknown as TNodePolkadotKusama
    destination = 'Ethereum'

    expect(() => validateDestination(origin, destination)).toThrow(IncompatibleNodesError)
  })

  it('should not throw when origin and destination relay chain symbols match even if destination is undefined', () => {
    origin = 'Acala'
    destination = 'Polkadot'

    vi.mocked(isDotKsmBridge).mockReturnValue(false)
    vi.mocked(isRelayChain).mockImplementation(node => node === destination)

    expect(() => validateDestination(origin, destination)).not.toThrow()
    expect(getRelayChainSymbol).not.toHaveBeenCalled()
  })

  it('should throw when origin and destination are relay chains', () => {
    origin = 'Polkadot'
    destination = 'Kusama'

    vi.mocked(isRelayChain).mockReturnValue(true)
    vi.mocked(isTLocation).mockReturnValue(false)

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
