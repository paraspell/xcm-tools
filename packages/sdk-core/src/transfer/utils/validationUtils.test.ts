import {
  getRelayChainSymbol,
  InvalidCurrencyError,
  isChainEvm,
  isSymbolSpecifier,
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

import type { IPolkadotApi } from '../../api'
import { ScenarioNotSupportedError, UnsupportedOperationError, ValidationError } from '../../errors'
import type { TDestination, TSendOptions } from '../../types'
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
  getRelayChainSymbol: vi.fn(),
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

  it('should not throw when currency has multiasset with length >1 and valid feeAsset', () => {
    const currency = [{}, {}] as TCurrencyInput

    expect(() => validateCurrency(currency, { symbol: 'DOT' })).not.toThrow()
  })

  it('should throw when currency has multiasset with length 1 or less', () => {
    const currency = [{}] as TCurrencyInput

    expect(() => validateCurrency(currency)).toThrow('Please provide more than one asset')
  })
})

describe('validateDestination', () => {
  let origin: TSubstrateChain
  let destination: TDestination

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isExternalChain).mockReturnValue(false)
  })

  it('should throw ScenarioNotSupportedError when destination is Ethereum and origin is not AssetHubPolkadot or Hydration', () => {
    origin = 'Acala'
    destination = 'Ethereum'

    vi.mocked(isExternalChain).mockReturnValue(true)

    expect(() => validateDestination(origin, destination)).toThrow(ScenarioNotSupportedError)
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

  it('should throw ScenarioNotSupportedError when relay chain symbols do not match and not a bridge transfer', () => {
    origin = 'Acala'
    destination = 'Astar'

    vi.mocked(isSubstrateBridge).mockReturnValue(false)
    vi.mocked(getRelayChainSymbol).mockReturnValueOnce('DOT').mockReturnValueOnce('KSM')

    expect(() => validateDestination(origin, destination)).toThrow(ScenarioNotSupportedError)
  })

  it('should not throw when relay chain symbols match and not a bridge transfer', () => {
    origin = 'Acala'
    destination = 'Astar'

    vi.mocked(isSubstrateBridge).mockReturnValue(false)
    vi.mocked(getRelayChainSymbol).mockReturnValueOnce('DOT').mockReturnValueOnce('DOT')

    expect(() => validateDestination(origin, destination)).not.toThrow()
  })

  it('should not throw when it is a bridge transfer regardless of relay chain symbols', () => {
    origin = 'Acala'
    destination = 'Astar'

    vi.mocked(isBridge).mockReturnValue(true)
    vi.mocked(getRelayChainSymbol).mockReturnValueOnce('DOT').mockReturnValueOnce('KSM')

    expect(() => validateDestination(origin, destination)).not.toThrow()
  })

  it('should not throw when destination is a location object and other conditions are met', () => {
    origin = 'Acala'
    destination = {} as TDestination

    vi.mocked(isSubstrateBridge).mockReturnValue(false)
    // Relay chain symbols should not be fetched in this case

    expect(() => validateDestination(origin, destination)).not.toThrow()
    expect(getRelayChainSymbol).not.toHaveBeenCalled()
  })

  it('should throw ScenarioNotSupportedError when origin is undefined and destination is Ethereum', () => {
    origin = undefined as unknown as TParachain
    destination = 'Ethereum'

    vi.mocked(isExternalChain).mockReturnValue(true)

    expect(() => validateDestination(origin, destination)).toThrow(ScenarioNotSupportedError)
  })

  it('should not throw when origin and destination relay chain symbols match even if destination is undefined', () => {
    origin = 'Acala'
    destination = 'Polkadot'

    vi.mocked(isSubstrateBridge).mockReturnValue(false)
    vi.mocked(isRelayChain).mockImplementation(chain => chain === destination)

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

  it('should throw ScenarioNotSupportedError when origin is a relay chain and destination parachain does not support relay to para transfers', () => {
    origin = 'Polkadot'
    destination = 'Acala'

    vi.mocked(isRelayChain).mockImplementation(chain => chain === origin)
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(isExternalChain).mockReturnValue(false)
    vi.mocked(getChain).mockReturnValueOnce({
      isRelayToParaEnabled: () => false
    } as unknown as ReturnType<typeof getChain>)

    expect(() => validateDestination(origin, destination)).toThrow(ScenarioNotSupportedError)
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
  const mockApi = {} as IPolkadotApi<unknown, unknown, unknown>

  const baseOptions = {
    api: mockApi,
    from: 'Polkadot',
    to: 'Kusama',
    senderAddress: 'addr1',
    address: 'addr2',
    transactOptions: { call: '0x123' }
  } as TSendOptions<unknown, unknown, unknown>

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

  it('returns ValidationError if senderAddress does not match destination', () => {
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
      address: 'addr1'
    })

    expect(result).toBeUndefined()
  })
})
