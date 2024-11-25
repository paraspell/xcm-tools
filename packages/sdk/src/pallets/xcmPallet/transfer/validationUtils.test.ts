import type { MockInstance } from 'vitest'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  validateAssetSpecifiers,
  validateAssetSupport,
  validateCurrency,
  validateDestination
} from './validationUtils'
import type {
  TAsset,
  TCurrencyInput,
  TDestination,
  TNodePolkadotKusama,
  TSendOptions
} from '../../../types'
import { IncompatibleNodesError, InvalidCurrencyError } from '../../../errors'
import { isBridgeTransfer } from './isBridgeTransfer'
import { getNativeAssets, getRelayChainSymbol, hasSupportForAsset } from '../../assets'
import { isSymbolSpecifier } from '../../../utils/assets/isSymbolSpecifier'
import { getDefaultPallet } from '../../pallets'
import type { Extrinsic, TPjsApi } from '../../../pjs'
import { throwUnsupportedCurrency } from '../utils'

vi.mock('./isBridgeTransfer', () => ({
  isBridgeTransfer: vi.fn()
}))

vi.mock('../../../utils/assets/isSymbolSpecifier', () => ({
  isSymbolSpecifier: vi.fn()
}))

vi.mock('../../pallets', () => ({
  getDefaultPallet: vi.fn()
}))

vi.mock('../../assets', () => ({
  getRelayChainSymbol: vi.fn(),
  getNativeAssets: vi.fn(),
  hasSupportForAsset: vi.fn()
}))

vi.mock('../utils', () => ({
  throwUnsupportedCurrency: vi.fn()
}))

describe('validateCurrency', () => {
  let consoleWarnSpy: MockInstance

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  it('should throw "Amount is required" when amount is null and currency does not have multiasset or has multilocation', () => {
    const currency = {} as TCurrencyInput
    const amount = null
    const feeAsset = undefined

    expect(() => validateCurrency(currency, amount, feeAsset)).toThrow('Amount is required')
  })

  it('should not throw when amount is provided and currency does not have multiasset', () => {
    const currency = {} as TCurrencyInput
    const amount = 100
    const feeAsset = undefined

    expect(() => validateCurrency(currency, amount, feeAsset)).not.toThrow()
  })

  it('should throw "Amount is required" when amount is null and currency has multilocation', () => {
    const currency = { multilocation: {} } as TCurrencyInput
    const amount = null
    const feeAsset = undefined

    expect(() => validateCurrency(currency, amount, feeAsset)).toThrow('Amount is required')
  })

  it('should warn when amount is not null and currency has multiasset', () => {
    const currency = { multiasset: [{}] } as TCurrencyInput
    const amount = 100
    const feeAsset = undefined

    validateCurrency(currency, amount, feeAsset)

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Amount is ignored when using overriding currency using multiple multi locations. Please set it to null.'
    )
  })

  it('should throw InvalidCurrencyError when currency.multiasset is empty', () => {
    const currency = { multiasset: [] } as TCurrencyInput
    const amount = null
    const feeAsset = undefined

    expect(() => validateCurrency(currency, amount, feeAsset)).toThrow(InvalidCurrencyError)
    expect(() => validateCurrency(currency, amount, feeAsset)).toThrow(
      'Overrided multi assets cannot be empty'
    )
  })

  it('should throw InvalidCurrencyError when currency.multiasset has length 1 and feeAsset is 0', () => {
    const currency = { multiasset: [{}] } as TCurrencyInput
    const amount = null
    const feeAsset = 0

    expect(() => validateCurrency(currency, amount, feeAsset)).toThrow(InvalidCurrencyError)
    expect(() => validateCurrency(currency, amount, feeAsset)).toThrow(
      'Overrided single multi asset cannot be used with fee asset'
    )
  })

  it('should throw InvalidCurrencyError when currency.multiasset has length 1 and feeAsset is defined', () => {
    const currency = { multiasset: [{}] } as TCurrencyInput
    const amount = null
    const feeAsset = 'someFeeAsset'

    expect(() => validateCurrency(currency, amount, feeAsset)).toThrow(InvalidCurrencyError)
    expect(() => validateCurrency(currency, amount, feeAsset)).toThrow(
      'Overrided single multi asset cannot be used with fee asset'
    )
  })

  it('should throw InvalidCurrencyError when currency.multiasset has length >1 and feeAsset is undefined', () => {
    const currency = { multiasset: [{}, {}] } as TCurrencyInput
    const amount = null
    const feeAsset = undefined

    expect(() => validateCurrency(currency, amount, feeAsset)).toThrow(InvalidCurrencyError)
    expect(() => validateCurrency(currency, amount, feeAsset)).toThrow(
      'Overrided multi assets cannot be used without specifying fee asset'
    )
  })

  it('should throw InvalidCurrencyError when feeAsset index is out of bounds (negative)', () => {
    const currency = { multiasset: [{}, {}] } as TCurrencyInput
    const amount = null
    const feeAsset = -1

    expect(() => validateCurrency(currency, amount, feeAsset)).toThrow(InvalidCurrencyError)
    expect(() => validateCurrency(currency, amount, feeAsset)).toThrow(
      'Fee asset index is out of bounds. Please provide a valid index.'
    )
  })

  it('should throw InvalidCurrencyError when feeAsset index is out of bounds (too large)', () => {
    const currency = { multiasset: [{}, {}] } as TCurrencyInput
    const amount = null
    const feeAsset = 2

    expect(() => validateCurrency(currency, amount, feeAsset)).toThrow(InvalidCurrencyError)
    expect(() => validateCurrency(currency, amount, feeAsset)).toThrow(
      'Fee asset index is out of bounds. Please provide a valid index.'
    )
  })

  it('should not throw when currency has multiasset with length >1 and valid feeAsset index', () => {
    const currency = { multiasset: [{}, {}] } as TCurrencyInput
    const amount = null
    const feeAsset = 0

    expect(() => validateCurrency(currency, amount, feeAsset)).not.toThrow()
  })

  it('should not throw when currency has multiasset with length 1 and feeAsset is undefined', () => {
    const currency = { multiasset: [{}] } as TCurrencyInput
    const amount = null
    const feeAsset = undefined

    expect(() => validateCurrency(currency, amount, feeAsset)).not.toThrow()
  })

  it('should not throw when amount is null and currency has multiasset', () => {
    const currency = { multiasset: [{}] } as TCurrencyInput
    const amount = null
    const feeAsset = undefined

    expect(() => validateCurrency(currency, amount, feeAsset)).not.toThrow()
  })
})

describe('validateDestination', () => {
  let origin: TNodePolkadotKusama
  let destination: TDestination | undefined

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
    destination = undefined

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
    destination = undefined

    vi.mocked(isBridgeTransfer).mockReturnValue(false)
    // Relay chain symbols are not checked when destination is undefined

    expect(() => validateDestination(origin, destination)).not.toThrow()
    expect(vi.mocked(getRelayChainSymbol)).not.toHaveBeenCalled()
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
      origin: 'Acala',
      destination: 'AssetHubPolkadot',
      currency: { symbol: 'TEST' }
    } as TSendOptions<TPjsApi, Extrinsic>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'TEST' }

    vi.mocked(getDefaultPallet).mockReturnValue('XTokens')
    vi.mocked(getNativeAssets).mockReturnValue([{ symbol: 'TEST' }])

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).toThrow(
      InvalidCurrencyError
    )
    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).toThrow(
      '"TEST" is not supported for transfers to AssetHubPolkadot.'
    )
  })

  it('should not throw when isBridge is true', () => {
    const options = {
      origin: 'Acala',
      destination: 'AssetHubPolkadot',
      currency: { symbol: 'TEST' }
    } as TSendOptions<TPjsApi, Extrinsic>

    const assetCheckEnabled = true
    const isBridge = true
    const asset = { symbol: 'TEST' }

    vi.mocked(getDefaultPallet).mockReturnValue('XTokens')
    vi.mocked(getNativeAssets).mockReturnValue([{ symbol: 'TEST' }])

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should not throw when destination is not AssetHub', () => {
    const options = {
      origin: 'Acala',
      destination: 'Astar',
      currency: { symbol: 'TEST' }
    } as TSendOptions<TPjsApi, Extrinsic>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'TEST' }

    vi.mocked(hasSupportForAsset).mockReturnValue(true)
    vi.mocked(getDefaultPallet).mockReturnValue('XTokens')

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should not throw when pallet is not XTokens', () => {
    const options = {
      origin: 'Acala',
      destination: 'AssetHubPolkadot',
      currency: { symbol: 'TEST' }
    } as TSendOptions<TPjsApi, Extrinsic>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'TEST' }

    vi.mocked(hasSupportForAsset).mockReturnValue(true)
    vi.mocked(getDefaultPallet).mockReturnValue('PolkadotXcm')

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should not throw when origin is Bifrost', () => {
    const options = {
      origin: 'BifrostPolkadot',
      destination: 'AssetHubPolkadot',
      currency: { symbol: 'TEST' }
    } as TSendOptions<TPjsApi, Extrinsic>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'TEST' }

    vi.mocked(hasSupportForAsset).mockReturnValue(true)
    vi.mocked(getDefaultPallet).mockReturnValue('XTokens')

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should filter out DOT from native assets when origin is Hydration', () => {
    const options = {
      origin: 'Hydration',
      destination: 'AssetHubPolkadot',
      currency: { symbol: 'DOT' }
    } as TSendOptions<TPjsApi, Extrinsic>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'DOT' }

    vi.mocked(getDefaultPallet).mockReturnValue('XTokens')
    vi.mocked(hasSupportForAsset).mockReturnValue(true)
    vi.mocked(getNativeAssets).mockReturnValue([{ symbol: 'DOT' }, { symbol: 'KSM' }])

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should throw InvalidCurrencyError when destination does not support asset', () => {
    const options = {
      origin: 'Acala',
      destination: 'Astar',
      currency: { symbol: 'UNSUPPORTED' }
    } as TSendOptions<TPjsApi, Extrinsic>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'UNSUPPORTED' }

    vi.mocked(hasSupportForAsset).mockReturnValue(false)

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).toThrow(
      InvalidCurrencyError
    )
    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).toThrow(
      'Destination node Astar does not support currency {"symbol":"UNSUPPORTED"}.'
    )
  })

  it('should not throw when destination supports asset', () => {
    const options = {
      origin: 'Acala',
      destination: 'Astar',
      currency: { symbol: 'SUPPORTED' }
    } as TSendOptions<TPjsApi, Extrinsic>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'SUPPORTED' }

    vi.mocked(hasSupportForAsset).mockReturnValue(true)

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should not throw when assetCheckEnabled is false', () => {
    const options = {
      origin: 'Acala',
      destination: 'Astar',
      currency: { symbol: 'ANY' }
    } as TSendOptions<TPjsApi, Extrinsic>

    const assetCheckEnabled = false
    const isBridge = false
    const asset = null

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should call throwUnsupportedCurrency when asset is null and assetCheckEnabled is true', () => {
    const options = {
      origin: 'Acala',
      destination: 'Astar',
      currency: { symbol: 'UNKNOWN' }
    } as TSendOptions<TPjsApi, Extrinsic>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = null

    validateAssetSupport(options, assetCheckEnabled, isBridge, asset)

    expect(throwUnsupportedCurrency).toHaveBeenCalledWith(options.currency, options.origin)
  })

  it('should not call throwUnsupportedCurrency when isBridge is true', () => {
    const options = {
      origin: 'Astar',
      destination: 'Acala',
      currency: { symbol: 'UNKNOWN' }
    } as TSendOptions<TPjsApi, Extrinsic>

    const assetCheckEnabled = true
    const isBridge = true
    const asset = null

    validateAssetSupport(options, assetCheckEnabled, isBridge, asset)

    expect(throwUnsupportedCurrency).not.toHaveBeenCalled()
  })

  it('should not throw when destination is relay (undefined)', () => {
    const options = {
      origin: 'Acala',
      destination: undefined,
      currency: { symbol: 'TEST' }
    } as TSendOptions<TPjsApi, Extrinsic>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'TEST' }

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should not throw when destination is a MultiLocation object', () => {
    const options = {
      origin: 'Acala',
      destination: {} as TDestination,
      currency: { symbol: 'TEST' }
    } as TSendOptions<TPjsApi, Extrinsic>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'TEST' }

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should not throw when asset symbol is undefined', () => {
    const options = {
      origin: 'Astar',
      destination: 'Acala',
      currency: {}
    } as TSendOptions<TPjsApi, Extrinsic>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: undefined } as TAsset

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should not throw when currency has id', () => {
    const options = {
      origin: 'Astar',
      destination: 'Acala',
      currency: { id: 'some-id' }
    } as TSendOptions<TPjsApi, Extrinsic>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'TEST' }

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })
})
