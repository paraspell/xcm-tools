import {
  InvalidCurrencyError,
  isChainEvm,
  isSymbolSpecifier,
  isTAsset,
  type TCurrencyInput
} from '@paraspell/assets'
import {
  isBridge,
  isExternalChain,
  isRelayChain,
  isSubstrateBridge,
  isTLocation,
  type TParachain,
  type TSubstrateChain
} from '@paraspell/sdk-common'
import { isHex } from 'viem'
import type { MockInstance } from 'vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError, UnsupportedOperationError, ValidationError } from '../../errors'
import type { TDestination, TSubstrateTransferOptions } from '../../types'
import { compareAddresses, getChain } from '../../utils'
import {
  validateAssetSpecifiers,
  validateCurrency,
  validateDestination,
  validateTransact
} from './validationUtils'

vi.mock('viem')
vi.mock('@paraspell/pallets')
vi.mock('@paraspell/sdk-common')
vi.mock('@paraspell/assets', () => ({
  getNativeAssets: vi.fn(),
  hasSupportForAsset: vi.fn(),
  InvalidCurrencyError: class extends Error {},
  isSymbolSpecifier: vi.fn(),
  isTAsset: vi.fn(),
  isChainEvm: vi.fn()
}))

vi.mock('../../utils')

describe('validateCurrency', () => {
  let consoleWarnSpy: MockInstance

  beforeEach(() => {
    vi.resetAllMocks()
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  it('should throw InvalidCurrencyError when currencies is empty', () => {
    const currency = [] as TCurrencyInput

    expect(() => validateCurrency(currency)).toThrow(InvalidCurrencyError)
    expect(() => validateCurrency(currency)).toThrow('Overridden assets cannot be empty')
  })

  it('should throw InvalidCurrencyError when currencies has length 1 and feeAsset is specified', () => {
    const currency = [{ symbol: 'DOT' }] as TCurrencyInput

    expect(() => validateCurrency(currency, { symbol: 'DOT' })).toThrow(InvalidCurrencyError)
    expect(() => validateCurrency(currency)).toThrow('Please provide more than one asset')
  })

  it('should throw InvalidCurrencyError when currencies has length >1 and feeAsset is undefined', () => {
    const currency = [{}, {}] as TCurrencyInput

    expect(() => validateCurrency(currency)).toThrow(InvalidCurrencyError)
    expect(() => validateCurrency(currency)).toThrow(
      'Overridden assets cannot be used without specifying fee asset'
    )
  })

  it('should not throw when currency is an array with length >1 and valid feeAsset', () => {
    const currency = [{}, {}] as TCurrencyInput

    expect(() => validateCurrency(currency, { symbol: 'DOT' })).not.toThrow()
  })

  it('should throw when using raw TAsset overrides', () => {
    const currency = [{}, {}] as TCurrencyInput

    vi.mocked(isTAsset).mockReturnValue(true)

    expect(() => validateCurrency(currency, { symbol: 'DOT' })).toThrow(
      'Raw asset overrides are no longer supported. Please use custom assets instead.'
    )
  })

  it('should throw when currency is an array with length 1 or less', () => {
    const currency = [{}] as TCurrencyInput

    expect(() => validateCurrency(currency)).toThrow('Please provide more than one asset')
  })
})

describe('validateDestination', () => {
  let origin: TSubstrateChain
  let destination: TDestination
  const api = { getRelayChainSymbol: vi.fn() } as unknown as PolkadotApi<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isExternalChain).mockReturnValue(false)
  })

  it('should throw ScenarioNotSupportedError when destination is Ethereum and origin is not AssetHubPolkadot or Hydration', () => {
    origin = 'Acala'
    destination = 'Ethereum'

    vi.mocked(isExternalChain).mockReturnValue(true)

    expect(() => validateDestination(origin, destination, api)).toThrow(ScenarioNotSupportedError)
  })

  it('should not throw when destination is Ethereum and origin is AssetHubPolkadot', () => {
    origin = 'AssetHubPolkadot'
    destination = 'Ethereum'

    expect(() => validateDestination(origin, destination, api)).not.toThrow()
  })

  it('should not throw when destination is Ethereum and origin is Hydration', () => {
    origin = 'Hydration'
    destination = 'Ethereum'

    expect(() => validateDestination(origin, destination, api)).not.toThrow()
  })

  it('should not throw when destination is undefined (relay destination)', () => {
    origin = 'AssetHubPolkadot'
    destination = 'Polkadot'

    expect(() => validateDestination(origin, destination, api)).not.toThrow()
  })

  it('should not throw when destination is a Location object', () => {
    origin = 'AssetHubPolkadot'
    destination = {} as TDestination

    expect(() => validateDestination(origin, destination, api)).not.toThrow()
  })

  it('should throw ScenarioNotSupportedError when relay chain symbols do not match and not a bridge transfer', () => {
    origin = 'Acala'
    destination = 'Astar'

    vi.mocked(isSubstrateBridge).mockReturnValue(false)
    vi.spyOn(api, 'getRelayChainSymbol').mockReturnValueOnce('DOT').mockReturnValueOnce('KSM')

    expect(() => validateDestination(origin, destination, api)).toThrow(ScenarioNotSupportedError)
  })

  it('should not throw when relay chain symbols match and not a bridge transfer', () => {
    origin = 'Acala'
    destination = 'Astar'

    vi.mocked(isSubstrateBridge).mockReturnValue(false)
    vi.spyOn(api, 'getRelayChainSymbol').mockReturnValueOnce('DOT').mockReturnValueOnce('DOT')

    expect(() => validateDestination(origin, destination, api)).not.toThrow()
  })

  it('should not throw when it is a bridge transfer regardless of relay chain symbols', () => {
    origin = 'Acala'
    destination = 'Astar'

    vi.mocked(isBridge).mockReturnValue(true)
    vi.spyOn(api, 'getRelayChainSymbol').mockReturnValueOnce('DOT').mockReturnValueOnce('KSM')

    expect(() => validateDestination(origin, destination, api)).not.toThrow()
  })

  it('should not throw when destination is a location object and other conditions are met', () => {
    origin = 'Acala'
    destination = {} as TDestination

    vi.mocked(isSubstrateBridge).mockReturnValue(false)
    // Relay chain symbols should not be fetched in this case
    const getRelayChainSymbolSpy = vi.spyOn(api, 'getRelayChainSymbol')

    expect(() => validateDestination(origin, destination, api)).not.toThrow()
    expect(getRelayChainSymbolSpy).not.toHaveBeenCalled()
  })

  it('should throw ScenarioNotSupportedError when origin is undefined and destination is Ethereum', () => {
    origin = undefined as unknown as TParachain
    destination = 'Ethereum'

    vi.mocked(isExternalChain).mockReturnValue(true)

    expect(() => validateDestination(origin, destination, api)).toThrow(ScenarioNotSupportedError)
  })

  it('should not throw when origin and destination relay chain symbols match for a para to relay transfer', () => {
    origin = 'Acala'
    destination = 'Polkadot'

    vi.mocked(isBridge).mockReturnValue(false)
    vi.mocked(isRelayChain).mockImplementation(chain => chain === destination)
    const getRelayChainSymbolSpy = vi
      .spyOn(api, 'getRelayChainSymbol')
      .mockReturnValueOnce('DOT')
      .mockReturnValueOnce('DOT')

    expect(() => validateDestination(origin, destination, api)).not.toThrow()
    expect(getRelayChainSymbolSpy).toHaveBeenCalled()
  })

  it('should throw ScenarioNotSupportedError for a cross-ecosystem para to relay transfer (AssetHubPolkadot -> Paseo)', () => {
    origin = 'AssetHubPolkadot'
    destination = 'Paseo'

    vi.mocked(isBridge).mockReturnValue(false)
    vi.mocked(isRelayChain).mockImplementation(chain => chain === destination)
    vi.spyOn(api, 'getRelayChainSymbol').mockReturnValueOnce('DOT').mockReturnValueOnce('PAS')

    expect(() => validateDestination(origin, destination, api)).toThrow(ScenarioNotSupportedError)
  })

  it('should not throw when origin and destination are the same relay chain', () => {
    origin = 'Polkadot'
    destination = 'Polkadot'

    vi.mocked(isBridge).mockReturnValue(false)
    vi.mocked(isRelayChain).mockReturnValue(true)
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.spyOn(api, 'getRelayChainSymbol').mockReturnValueOnce('DOT').mockReturnValueOnce('DOT')
    vi.mocked(getChain).mockReturnValue({
      isRelayToParaEnabled: () => true
    } as unknown as ReturnType<typeof getChain>)

    expect(() => validateDestination(origin, destination, api)).not.toThrow()
  })

  it('should not throw for a custom chain transferring to its own relay chain', () => {
    const customOrigin = 'MyCustomChain'
    destination = 'Polkadot'

    const customApi = {
      getRelayChainSymbol: vi.fn()
    } as unknown as PolkadotApi<unknown, unknown, unknown>

    vi.mocked(isBridge).mockReturnValue(false)
    vi.mocked(isRelayChain).mockImplementation(chain => chain === destination)
    const getRelayChainSymbolSpy = vi
      .spyOn(customApi, 'getRelayChainSymbol')
      .mockReturnValueOnce('DOT')
      .mockReturnValueOnce('DOT')

    expect(() => validateDestination(customOrigin, destination, customApi)).not.toThrow()
    expect(getRelayChainSymbolSpy).toHaveBeenCalledWith(customOrigin)
    expect(getRelayChainSymbolSpy).toHaveBeenCalledWith(destination)
  })

  it('should throw ScenarioNotSupportedError for a custom chain transferring to a foreign relay chain', () => {
    const customOrigin = 'MyCustomChain'
    destination = 'Paseo'

    const customApi = {
      getRelayChainSymbol: vi.fn()
    } as unknown as PolkadotApi<unknown, unknown, unknown>

    vi.mocked(isBridge).mockReturnValue(false)
    vi.mocked(isRelayChain).mockImplementation(chain => chain === destination)
    vi.spyOn(customApi, 'getRelayChainSymbol').mockReturnValueOnce('DOT').mockReturnValueOnce('PAS')

    expect(() => validateDestination(customOrigin, destination, customApi)).toThrow(
      ScenarioNotSupportedError
    )
  })

  it('should throw when origin and destination are relay chains', () => {
    origin = 'Polkadot'
    destination = 'Kusama'

    vi.mocked(isRelayChain).mockReturnValue(true)
    vi.mocked(isTLocation).mockReturnValue(false)

    expect(() => validateDestination(origin, destination, api)).toThrow()
    expect(isRelayChain).toHaveBeenCalled()
  })

  it('should throw ScenarioNotSupportedError when origin is a relay chain and destination parachain does not support relay to para transfers', () => {
    origin = 'Polkadot'
    destination = 'Acala'

    vi.mocked(isRelayChain).mockImplementation(chain => chain === origin)
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(isExternalChain).mockReturnValue(false)
    vi.mocked(getChain).mockReturnValueOnce({
      isRelayToParaEnabled: () => false
    } as unknown as ReturnType<typeof getChain>)

    expect(() => validateDestination(origin, destination, api)).toThrow(ScenarioNotSupportedError)
    expect(getChain).toHaveBeenCalledWith(destination)
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

describe('validateTransact', () => {
  const mockApi = {} as PolkadotApi<unknown, unknown, unknown>

  const baseOptions = {
    api: mockApi,
    from: 'Polkadot',
    to: 'Kusama',
    sender: 'addr1',
    recipient: 'addr2',
    transactOptions: { call: '0x123' }
  } as TSubstrateTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns undefined when no transact call provided', () => {
    const result = validateTransact({
      ...baseOptions,
      transactOptions: undefined
    })
    expect(result).toBeUndefined()
  })

  it('throws UnsupportedOperationError for local transfer', () => {
    expect(() =>
      validateTransact({
        ...baseOptions,
        from: 'Polkadot',
        to: 'Polkadot',
        transactOptions: { call: '0x123' }
      })
    ).toThrowError(UnsupportedOperationError)
  })

  it('throws UnsupportedOperationError for currency arrays', () => {
    vi.mocked(isHex).mockReturnValue(true)

    expect(() =>
      validateTransact({
        ...baseOptions,
        currency: [
          { symbol: 'USDT', amount: 1n },
          { symbol: 'USDC', amount: 2n }
        ]
      })
    ).toThrowError('Cannot use transact options with multiple currencies.')
  })

  it('throws ValidationError for non-hex call string', () => {
    vi.mocked(isHex).mockReturnValue(false)

    expect(() =>
      validateTransact({
        ...baseOptions,
        transactOptions: { call: 'nothex' }
      })
    ).toThrowError(ValidationError)
  })

  it('throws UnsupportedOperationError if from or to is an EVM chain', () => {
    vi.mocked(isHex).mockReturnValue(true)
    vi.mocked(isChainEvm).mockReturnValue(true)

    expect(() =>
      validateTransact({
        ...baseOptions,
        from: 'Moonbeam'
      })
    ).toThrowError(UnsupportedOperationError)

    expect(() =>
      validateTransact({
        ...baseOptions,
        to: 'Moonbeam'
      })
    ).toThrowError(UnsupportedOperationError)
  })

  it('returns ValidationError if sender does not match destination', () => {
    vi.mocked(isHex).mockReturnValue(true)
    vi.mocked(isChainEvm).mockReturnValue(false)
    vi.mocked(compareAddresses).mockReturnValue(false)

    const result = validateTransact({
      ...baseOptions
    })

    expect(result).toBeInstanceOf(ValidationError)
  })

  it('returns undefined for valid substrate to substrate call', () => {
    vi.mocked(isHex).mockReturnValue(true)
    vi.mocked(isChainEvm).mockReturnValue(false)
    vi.mocked(compareAddresses).mockReturnValue(true)

    const result = validateTransact({
      ...baseOptions,
      recipient: 'addr1'
    })

    expect(result).toBeUndefined()
  })
})
