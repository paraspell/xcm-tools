import {
  findAssetInfoOnDest,
  findNativeAssetInfoOrThrow,
  InvalidCurrencyError,
  isAssetEqual,
  isBridgedSystemAsset,
  type TAssetInfo
} from '@paraspell/assets'
import { isExternalChain, isTLocation, Parents } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TDestination, TSendOptions } from '../../types'
import { getRelayChainOf, throwUnsupportedCurrency } from '../../utils'
import {
  validateAssetSupport,
  validateEcosystems,
  validateEthereumAsset
} from './validateAssetSupport'

vi.mock('@paraspell/sdk-common', async importOriginal => ({
  ...(await importOriginal()),
  isExternalChain: vi.fn(),
  isTLocation: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  findNativeAssetInfoOrThrow: vi.fn(),
  findAssetInfoOnDest: vi.fn(),
  InvalidCurrencyError: class extends Error {},
  isAssetEqual: vi.fn(),
  isBridgedSystemAsset: vi.fn(),
  isStableCoinAsset: vi.fn()
}))

vi.mock('../../utils')

describe('validateAssetSupport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(isExternalChain).mockReturnValue(false)
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'NATIVE' } as TAssetInfo)
    vi.mocked(isAssetEqual).mockReturnValue(false)
    vi.mocked(isBridgedSystemAsset).mockReturnValue(false)
  })

  it('should not throw when bridged asset matches target relay consensus', () => {
    const options = {
      from: 'Astar',
      to: 'Acala',
      currency: { symbol: 'BRIDGED' }
    } as TSendOptions<unknown, unknown, unknown>

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

    vi.mocked(findAssetInfoOnDest).mockReturnValue(asset)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'NATIVE' } as TAssetInfo)
    vi.mocked(isAssetEqual).mockReturnValue(false)
    vi.mocked(isBridgedSystemAsset).mockReturnValue(true)

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
    expect(throwUnsupportedCurrency).not.toHaveBeenCalled()
  })

  it('should throw when bridge asset is neither native nor bridged', () => {
    const options = {
      from: 'Astar',
      to: 'Acala',
      currency: { symbol: 'FOREIGN' }
    } as TSendOptions<unknown, unknown, unknown>

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

    vi.mocked(findAssetInfoOnDest).mockReturnValue({ symbol: 'FOREIGN' } as TAssetInfo)

    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'NATIVE' } as TAssetInfo)
    vi.mocked(isAssetEqual).mockReturnValue(false)
    vi.mocked(isBridgedSystemAsset).mockReturnValue(false)

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
    } as TSendOptions<unknown, unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'TEST' } as TAssetInfo

    vi.mocked(findAssetInfoOnDest).mockReturnValue({ symbol: 'TEST' } as TAssetInfo)

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should not throw when origin is Bifrost', () => {
    const options = {
      from: 'BifrostPolkadot',
      to: 'AssetHubPolkadot',
      currency: { symbol: 'TEST' }
    } as TSendOptions<unknown, unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'TEST' } as TAssetInfo

    vi.mocked(findAssetInfoOnDest).mockReturnValue({ symbol: 'TEST' } as TAssetInfo)

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should throw InvalidCurrencyError when destination does not support asset', () => {
    const options = {
      from: 'Acala',
      to: 'Astar',
      currency: { symbol: 'UNSUPPORTED' }
    } as TSendOptions<unknown, unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'UNSUPPORTED' } as TAssetInfo

    vi.mocked(findAssetInfoOnDest).mockReturnValue(null)

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
    } as TSendOptions<unknown, unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'SUPPORTED' } as TAssetInfo

    vi.mocked(findAssetInfoOnDest).mockReturnValue({ symbol: 'SUPPORTED' } as TAssetInfo)

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should not throw when assetCheckEnabled is false', () => {
    const options = {
      from: 'Acala',
      to: 'Astar',
      currency: { symbol: 'ANY' }
    } as TSendOptions<unknown, unknown, unknown>

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
    } as TSendOptions<unknown, unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = null

    validateAssetSupport(options, assetCheckEnabled, isBridge, asset)

    expect(throwUnsupportedCurrency).toHaveBeenCalledWith(options.currency, options.from)
  })

  it('should not throw when destination is a location object', () => {
    const options = {
      from: 'Acala',
      to: {} as TDestination,
      currency: { symbol: 'TEST' }
    } as TSendOptions<unknown, unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = { symbol: 'TEST' } as TAssetInfo

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()
  })

  it('should call validateEthereumAsset', () => {
    const options = {
      from: 'AssetHubPolkadot',
      to: 'Ethereum',
      currency: { symbol: 'DOT' }
    } as TSendOptions<unknown, unknown, unknown>

    const assetCheckEnabled = true
    const isBridge = false
    const asset = {
      symbol: 'DOT',
      location: {
        parents: Parents.ONE,
        interior: { Here: null }
      }
    } as TAssetInfo

    vi.mocked(isExternalChain).mockReturnValue(true)

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, asset)).not.toThrow()

    const invalidAsset = {
      symbol: 'INVALID',
      location: {
        parents: Parents.ONE,
        interior: { X1: [{ PalletInstance: 50 }] }
      }
    } as TAssetInfo

    expect(() => validateAssetSupport(options, assetCheckEnabled, isBridge, invalidAsset)).toThrow(
      InvalidCurrencyError
    )
  })
})

describe('validateEthereumAsset', () => {
  it('should return early when asset is null', () => {
    expect(() => validateEthereumAsset('AssetHubPolkadot', 'Ethereum', null)).not.toThrow()
  })

  it('should return early when destination is not Ethereum', () => {
    const asset = {
      symbol: 'TEST',
      location: {
        parents: Parents.ONE,
        interior: { X1: [{ PalletInstance: 50 }] }
      }
    } as TAssetInfo

    expect(() => validateEthereumAsset('AssetHubPolkadot', 'Acala', asset)).not.toThrow()
  })

  it('should return early when origin is Mythos', () => {
    const asset = {
      symbol: 'TEST',
      location: {
        parents: Parents.ONE,
        interior: { X1: [{ PalletInstance: 50 }] }
      }
    } as TAssetInfo

    expect(() => validateEthereumAsset('Mythos', 'Ethereum', asset)).not.toThrow()
  })

  it('should not throw for asset with Ethereum GlobalConsensus location', () => {
    const asset = {
      symbol: 'WETH',
      location: {
        parents: Parents.TWO,
        interior: {
          X2: [
            { GlobalConsensus: { Ethereum: { chainId: 1 } } },
            { AccountKey20: { key: '0x1234567890abcdef1234567890abcdef12345678' } }
          ]
        }
      }
    } as TAssetInfo

    expect(() => validateEthereumAsset('AssetHubPolkadot', 'Ethereum', asset)).not.toThrow()
  })

  it('should not throw for asset with RELAY_LOCATION (DOT)', () => {
    const asset = {
      symbol: 'DOT',
      location: {
        parents: Parents.ONE,
        interior: { Here: null }
      }
    } as TAssetInfo

    expect(() => validateEthereumAsset('AssetHubPolkadot', 'Ethereum', asset)).not.toThrow()
  })

  it('should not throw for asset with Kusama GlobalConsensus location', () => {
    const asset = {
      symbol: 'KSM',
      location: {
        parents: 2,
        interior: { X1: [{ GlobalConsensus: { Kusama: null } }] }
      }
    } as TAssetInfo

    expect(() => validateEthereumAsset('AssetHubPolkadot', 'Ethereum', asset)).not.toThrow()
  })

  it('should throw InvalidCurrencyError for non-Ethereum-compatible asset', () => {
    const asset = {
      symbol: 'FOREIGN',
      location: {
        parents: Parents.ONE,
        interior: {
          X2: [{ Parachain: 2000 }, { PalletInstance: 50 }]
        }
      }
    } as TAssetInfo

    expect(() => validateEthereumAsset('AssetHubPolkadot', 'Ethereum', asset)).toThrow(
      InvalidCurrencyError
    )
    expect(() => validateEthereumAsset('AssetHubPolkadot', 'Ethereum', asset)).toThrow(
      'is not transferable to Ethereum'
    )
  })

  it('should throw InvalidCurrencyError for asset with wrong GlobalConsensus', () => {
    const asset: TAssetInfo = {
      symbol: 'WRONG',
      decimals: 18,
      location: {
        parents: Parents.TWO,
        interior: {
          X1: [{ GlobalConsensus: { Polkadot: null } }]
        }
      }
    }

    expect(() => validateEthereumAsset('AssetHubPolkadot', 'Ethereum', asset)).toThrow(
      InvalidCurrencyError
    )
    expect(() => validateEthereumAsset('AssetHubPolkadot', 'Ethereum', asset)).toThrow(
      'is not transferable to Ethereum'
    )
  })

  it('should throw InvalidCurrencyError for asset without location', () => {
    const asset: TAssetInfo = {
      symbol: 'NOLOC',
      decimals: 18,
      location: {
        parents: Parents.ZERO,
        interior: { Here: null }
      }
    }

    expect(() => validateEthereumAsset('AssetHubPolkadot', 'Ethereum', asset)).toThrow(
      InvalidCurrencyError
    )
    expect(() => validateEthereumAsset('AssetHubPolkadot', 'Ethereum', asset)).toThrow(
      'is not transferable to Ethereum'
    )
  })
})

describe('validateEcosystems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
  })

  it('returns early for location destination', () => {
    vi.mocked(isTLocation).mockReturnValue(true)

    expect(() =>
      validateEcosystems('AssetHubPolkadot', { parents: 1, interior: { Here: null } })
    ).not.toThrow()
  })

  it('allows Ethereum from Polkadot relay chain', () => {
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    expect(() => validateEcosystems('AssetHubPolkadot', 'Ethereum')).not.toThrow()
  })

  it('rejects Ethereum from non-Polkadot relay chains', () => {
    vi.mocked(getRelayChainOf).mockReturnValue('Kusama')

    expect(() => validateEcosystems('AssetHubPolkadot', 'Ethereum')).toThrow(InvalidCurrencyError)
    expect(() => validateEcosystems('AssetHubPolkadot', 'Ethereum')).toThrow(
      'Destination Ethereum is only supported from following ecosystems: Polkadot.'
    )
  })

  it('allows EthereumTestnet from Westend or Paseo relay chains', () => {
    vi.mocked(getRelayChainOf).mockReturnValue('Westend')
    expect(() => validateEcosystems('AssetHubPolkadot', 'EthereumTestnet')).not.toThrow()

    vi.mocked(getRelayChainOf).mockReturnValue('Paseo')
    expect(() => validateEcosystems('AssetHubPolkadot', 'EthereumTestnet')).not.toThrow()
  })

  it('rejects EthereumTestnet from other relay chains', () => {
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    expect(() => validateEcosystems('AssetHubPolkadot', 'EthereumTestnet')).toThrow(
      InvalidCurrencyError
    )
    expect(() => validateEcosystems('AssetHubPolkadot', 'EthereumTestnet')).toThrow(
      'Destination EthereumTestnet is only supported from following ecosystems: Westend, Paseo.'
    )
  })

  it('does nothing for non-mapped destinations', () => {
    vi.mocked(getRelayChainOf).mockReturnValue('Kusama')

    expect(() => validateEcosystems('AssetHubKusama', 'Acala')).not.toThrow()
  })
})
