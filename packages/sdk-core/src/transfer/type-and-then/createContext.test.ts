import {
  extractAssetLocation,
  isAssetEqual,
  type TAssetInfo,
  type TAssetWithFee,
  type WithAmount
} from '@paraspell/assets'
import {
  isExternalChain,
  isRelayChain,
  isSubstrateBridge,
  isTLocation,
  type TChain,
  type TLocation,
  type TSubstrateChain
} from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { RELAY_LOCATION } from '../../constants'
import { ScenarioNotSupportedError } from '../../errors'
import type { TPolkadotXCMTransferOptions, TTypeAndThenCallContext } from '../../types'
import { getRelayChainOf } from '../../utils'
import { getEthereumJunction } from '../../utils/location/getEthereumJunction'
import {
  createTypeAndThenCallContext,
  getBridgeReserve,
  getFeeAssetLocation
} from './createContext'

vi.mock('@paraspell/sdk-common', async importOriginal => ({
  ...(await importOriginal()),
  isExternalChain: vi.fn(),
  isRelayChain: vi.fn(),
  isSubstrateBridge: vi.fn(),
  isTLocation: vi.fn()
}))

vi.mock('@paraspell/assets')

vi.mock('../../utils')
vi.mock('../../utils/location/getEthereumJunction')
vi.mock('../../constants', () => ({
  RELAY_LOCATION: {
    parents: 1,
    interior: { Here: null }
  }
}))

describe('getBridgeReserve', () => {
  const originChain: TSubstrateChain = 'BridgeHubPolkadot'
  const destinationChain: TSubstrateChain = 'BridgeHubKusama'
  const bridgeMockApi = {} as PolkadotApi<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRelayChainOf).mockImplementation(chain =>
      chain.toLowerCase().includes('kusama') ? 'Kusama' : 'Polkadot'
    )
    vi.mocked(isExternalChain).mockReturnValue(false)
    vi.mocked(getEthereumJunction).mockReturnValue({
      GlobalConsensus: { Ethereum: { chainId: 1 } }
    })
  })

  it('returns the origin chain when asset location is relay', () => {
    const result = getBridgeReserve(bridgeMockApi, originChain, destinationChain, RELAY_LOCATION)

    expect(result).toBe(originChain)
  })

  it('returns the origin chain when asset location differs from relay', () => {
    const parachainLocation: TLocation = {
      parents: 1,
      interior: { X1: { Parachain: 2000 } }
    }

    const result = getBridgeReserve(bridgeMockApi, originChain, destinationChain, parachainLocation)

    expect(result).toBe(originChain)
  })

  it('returns destination when external chain consensus matches location', () => {
    vi.mocked(isExternalChain).mockReturnValue(true)

    const ethLocation: TLocation = {
      parents: 2,
      interior: {
        X1: [{ GlobalConsensus: { Ethereum: { chainId: 1 } } }]
      }
    }

    const result = getBridgeReserve(bridgeMockApi, originChain, 'Ethereum', ethLocation)

    expect(result).toBe('Ethereum')
  })

  it('returns origin when external chain consensus does not match location', () => {
    vi.mocked(isExternalChain).mockReturnValue(true)

    const mismatchLocation: TLocation = {
      parents: 2,
      interior: {
        X1: [{ GlobalConsensus: { Ethereum: { chainId: 11155111 } } }]
      }
    }

    const result = getBridgeReserve(bridgeMockApi, originChain, 'Ethereum', mismatchLocation)

    expect(result).toBe(originChain)
  })

  it('returns the Ethereum bridge asset hub when a snowbridge asset crosses a substrate bridge', () => {
    const ethLocation: TLocation = {
      parents: 2,
      interior: {
        X2: [
          { GlobalConsensus: { Ethereum: { chainId: 1 } } },
          { AccountKey20: { network: null, key: '0x0e186357c323c806c1efdad36d217f7a54b63d18' } }
        ]
      }
    }

    expect(getBridgeReserve(bridgeMockApi, 'AssetHubKusama', 'AssetHubPolkadot', ethLocation)).toBe(
      'AssetHubPolkadot'
    )

    expect(getBridgeReserve(bridgeMockApi, 'AssetHubPolkadot', 'AssetHubKusama', ethLocation)).toBe(
      'AssetHubPolkadot'
    )
  })

  it('returns destination when relay consensus matches location', () => {
    const relayLocation: TLocation = {
      parents: 2,
      interior: { X1: [{ GlobalConsensus: { kusama: null } }] }
    }

    const result = getBridgeReserve(bridgeMockApi, originChain, destinationChain, relayLocation)

    expect(result).toBe(destinationChain)
  })
})

describe('createTypeAndThenCallContext', () => {
  const mockChain: TSubstrateChain = 'AssetHubPolkadot'
  const mockDestChain: TChain = 'Acala'
  const mockReserveChain: TSubstrateChain = 'Polkadot'

  const mockAsset: WithAmount<TAssetInfo> = {
    amount: 1000n,
    symbol: 'DOT',
    decimals: 10,
    location: { parents: 1, interior: { X1: { Parachain: 2000 } } }
  }

  const mockSystemAsset: TAssetInfo = {
    symbol: 'DOT',
    decimals: 12,
    location: RELAY_LOCATION
  }

  const wudLocation: TLocation = {
    parents: 1,
    interior: {
      X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 31337 }]
    }
  }

  const mockClonedApi = {
    init: vi.fn().mockResolvedValue(undefined)
  }

  const mockApi = {
    clone: vi.fn().mockReturnValue(mockClonedApi),
    init: vi.fn().mockResolvedValue(undefined),
    findAssetInfoOrThrow: vi.fn(),
    findNativeAssetInfoOrThrow: vi.fn(),
    getAssetReserveChain: vi.fn(),
    getRelayChainOf: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  const findNativeAssetInfoOrThrowSpy = vi.spyOn(mockApi, 'findNativeAssetInfoOrThrow')
  const findAssetInfoOrThrowSpy = vi.spyOn(mockApi, 'findAssetInfoOrThrow')
  const getAssetReserveChainSpy = vi.spyOn(mockApi, 'getAssetReserveChain')
  const getRelayChainOfSpy = vi.spyOn(mockApi, 'getRelayChainOf')

  const mockOptions = {
    api: mockApi,
    chain: mockChain,
    destination: mockDestChain,
    assetInfo: mockAsset
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    getRelayChainOfSpy.mockReturnValue('Polkadot')
    vi.mocked(isRelayChain).mockReturnValue(false)
    vi.mocked(isSubstrateBridge).mockReturnValue(false)
    vi.mocked(isTLocation).mockReturnValue(false)
    getAssetReserveChainSpy.mockReturnValue(mockReserveChain)
    findAssetInfoOrThrowSpy.mockReturnValue({
      symbol: 'WUD',
      decimals: 10,
      location: wudLocation
    })
    findNativeAssetInfoOrThrowSpy.mockReturnValue(mockSystemAsset)
  })

  it('should create context with relay chain as destination', async () => {
    const relayDestChain: TSubstrateChain = 'Polkadot'
    vi.mocked(isRelayChain).mockReturnValue(true)

    const options = {
      ...mockOptions,
      destination: relayDestChain
    }

    const result = await createTypeAndThenCallContext(options, {})

    expect(getAssetReserveChainSpy).toHaveBeenCalled()
    expect(mockClonedApi.init).toHaveBeenCalledTimes(2)

    expect(result).toEqual({
      origin: { api: mockApi, chain: mockChain },
      dest: { api: mockClonedApi, chain: relayDestChain },
      reserve: { api: mockClonedApi, chain: relayDestChain },
      isSubBridge: false,
      isSnowbridge: false,
      isRelayAsset: false,
      assetInfo: mockAsset,
      systemAsset: mockSystemAsset,
      options
    })
  })

  it('marks a user-defined fee asset as separate and disables the relay fee asset', async () => {
    const feeAssetInfo: TAssetInfo = {
      symbol: 'USDT',
      decimals: 6,
      location: { parents: 1, interior: { X1: { Parachain: 1000 } } }
    }
    vi.mocked(isAssetEqual).mockReturnValue(false)

    const result = await createTypeAndThenCallContext(
      { ...mockOptions, assetInfo: { ...mockAsset, location: RELAY_LOCATION }, feeAssetInfo },
      {}
    )

    expect(isAssetEqual).toHaveBeenCalledWith(
      expect.objectContaining({ location: RELAY_LOCATION }),
      feeAssetInfo
    )
    expect(result.feeAssetInfo).toBe(feeAssetInfo)
    expect(result.isRelayAsset).toBe(false)
  })

  it('resolves the fee reserve from the user-defined fee asset', async () => {
    const feeLocation: TLocation = { parents: 1, interior: { X1: { Parachain: 1000 } } }
    vi.mocked(isAssetEqual).mockReturnValue(false)
    getAssetReserveChainSpy.mockReturnValueOnce('Polkadot').mockReturnValueOnce('Polkadot')

    const result = await createTypeAndThenCallContext(
      { ...mockOptions, feeAssetInfo: { symbol: 'USDT', decimals: 6, location: feeLocation } },
      {}
    )

    expect(getAssetReserveChainSpy).toHaveBeenNthCalledWith(2, mockChain, feeLocation, false)
    expect(result.reserve.chain).toBe('Polkadot')
    expect(result.feeReserveChain).toBe('Polkadot')
  })

  it('throws when the fee asset reserve is neither the origin nor the routed chain', async () => {
    const feeLocation: TLocation = { parents: 1, interior: { X1: { Parachain: 1000 } } }
    vi.mocked(isAssetEqual).mockReturnValue(false)
    getAssetReserveChainSpy.mockReturnValueOnce('Polkadot').mockReturnValueOnce('Hydration')

    await expect(
      createTypeAndThenCallContext(
        { ...mockOptions, feeAssetInfo: { symbol: 'USDT', decimals: 6, location: feeLocation } },
        {}
      )
    ).rejects.toThrow(ScenarioNotSupportedError)
  })

  it('takes the reserve from the transferred asset of a multi-asset transfer', async () => {
    const transferredLocation: TLocation = {
      parents: 2,
      interior: { X1: [{ GlobalConsensus: { Ethereum: { chainId: 1 } } }] }
    }
    const overriddenAsset: TAssetWithFee[] = [
      { id: mockAsset.location, fun: { Fungible: 1n }, isFeeAsset: true },
      { id: transferredLocation, fun: { Fungible: 2n } }
    ]
    vi.mocked(extractAssetLocation).mockImplementation(asset => asset.id as TLocation)
    getAssetReserveChainSpy
      .mockReturnValueOnce('AssetHubPolkadot')
      .mockReturnValueOnce('AssetHubPolkadot')

    const result = await createTypeAndThenCallContext({ ...mockOptions, overriddenAsset }, {})

    expect(getAssetReserveChainSpy).toHaveBeenNthCalledWith(
      1,
      mockChain,
      transferredLocation,
      false
    )
    expect(getAssetReserveChainSpy).toHaveBeenNthCalledWith(2, mockChain, mockAsset.location, false)
    expect(result.reserve.chain).toBe('AssetHubPolkadot')
    expect(result.feeReserveChain).toBe('AssetHubPolkadot')
    expect(result.feeAssetInfo).toBeUndefined()
  })

  it('ignores a fee asset equal to the transferred asset', async () => {
    vi.mocked(isAssetEqual).mockReturnValue(true)

    const result = await createTypeAndThenCallContext(
      {
        ...mockOptions,
        assetInfo: { ...mockAsset, location: RELAY_LOCATION },
        feeAssetInfo: mockAsset
      },
      {}
    )

    expect(result.feeAssetInfo).toBeUndefined()
    expect(result.isRelayAsset).toBe(true)
  })

  it('should create context with non-relay chain as destination', async () => {
    const result = await createTypeAndThenCallContext(mockOptions, {})

    expect(getAssetReserveChainSpy).toHaveBeenCalledWith(mockChain, mockAsset.location, false)
    expect(mockClonedApi.init).toHaveBeenNthCalledWith(1, mockDestChain)
    expect(mockClonedApi.init).toHaveBeenNthCalledWith(2, mockReserveChain)

    expect(result).toEqual({
      origin: { api: mockApi, chain: mockChain },
      dest: { api: mockClonedApi, chain: mockDestChain },
      reserve: { api: mockClonedApi, chain: mockReserveChain },
      isSubBridge: false,
      isRelayAsset: false,
      isSnowbridge: false,
      assetInfo: mockAsset,
      systemAsset: mockSystemAsset,
      options: mockOptions
    })
  })

  it('keeps the ETH reserve on Asset Hub for AssetHubPolkadot to Hydration', async () => {
    const ethAsset = {
      ...mockAsset,
      symbol: 'ETH',
      location: {
        parents: 2,
        interior: {
          X1: [{ GlobalConsensus: { Ethereum: { chainId: 1 } } }]
        }
      } as TLocation
    }
    const options = {
      ...mockOptions,
      destination: 'Hydration' as const,
      assetInfo: ethAsset
    }
    getAssetReserveChainSpy.mockReturnValue('AssetHubPolkadot')

    const result = await createTypeAndThenCallContext(options, {})

    expect(getAssetReserveChainSpy).toHaveBeenCalledWith(
      'AssetHubPolkadot',
      ethAsset.location,
      false
    )
    expect(result.reserve.chain).toBe('AssetHubPolkadot')
    expect(result.dest.chain).toBe('Hydration')
  })

  it('adds an Asset Hub hop for ETH sent from another parachain to Hydration', async () => {
    const ethAsset = {
      ...mockAsset,
      symbol: 'ETH',
      location: {
        parents: 2,
        interior: {
          X1: [{ GlobalConsensus: { Ethereum: { chainId: 1 } } }]
        }
      } as TLocation
    }
    const options = {
      ...mockOptions,
      chain: 'Acala' as const,
      destination: 'Hydration' as const,
      assetInfo: ethAsset
    }
    getAssetReserveChainSpy.mockReturnValue('AssetHubPolkadot')

    const result = await createTypeAndThenCallContext(options, {})

    expect(getAssetReserveChainSpy).toHaveBeenCalledWith('Acala', ethAsset.location, false)
    expect(result.reserve.chain).toBe('AssetHubPolkadot')
    expect(result.bridgeHopChain).toBe('AssetHubPolkadot')
    expect(result.dest.chain).toBe('Hydration')
  })

  it('requires DOT for a Snowbridge asset sent from Asset Hub to Jamton', async () => {
    const cgtAsset = {
      ...mockAsset,
      symbol: 'CGT',
      location: {
        parents: 2,
        interior: {
          X2: [
            { GlobalConsensus: { Ethereum: { chainId: 1 } } },
            {
              AccountKey20: {
                network: null,
                key: '0x0e186357c323c806c1efdad36d217f7a54b63d18'
              }
            }
          ]
        }
      } as TLocation
    }
    const options = {
      ...mockOptions,
      destination: 'Jamton' as const,
      assetInfo: cgtAsset
    }
    getAssetReserveChainSpy.mockReturnValue('AssetHubPolkadot')

    const result = await createTypeAndThenCallContext(options, { noFeeAsset: true })

    expect(result.isRelayAsset).toBe(false)
    expect(result.systemAsset).toBe(mockSystemAsset)
  })

  it.each([
    ['WUD', 31337],
    ['PINK', 23]
  ])(
    'requires DOT for %s by Asset Hub location between parachains',
    async (symbol, generalIndex) => {
      const asset = {
        ...mockAsset,
        symbol,
        location: {
          parents: 1,
          interior: {
            X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: generalIndex }]
          }
        } as TLocation
      }
      const options = {
        ...mockOptions,
        chain: 'Jamton' as const,
        destination: 'AssetHubPolkadot' as const,
        assetInfo: asset
      }
      getAssetReserveChainSpy.mockReturnValue('AssetHubPolkadot')

      const result = await createTypeAndThenCallContext(options, { noFeeAsset: true })

      expect(findAssetInfoOrThrowSpy).toHaveBeenCalledWith('Jamton', { symbol: 'WUD' })
      expect(result.isRelayAsset).toBe(false)
      expect(result.systemAsset).toBe(mockSystemAsset)
    }
  )

  it('does not require a separate relay asset for WUD sent to the relay chain', async () => {
    vi.mocked(isRelayChain).mockImplementation(chain => chain === 'Polkadot')
    const options = {
      ...mockOptions,
      chain: 'Jamton' as const,
      destination: 'Polkadot' as const,
      assetInfo: { ...mockAsset, symbol: 'WUD', location: wudLocation }
    }

    const result = await createTypeAndThenCallContext(options, { noFeeAsset: true })

    expect(result.isRelayAsset).toBe(true)
  })

  it('does not add an Asset Hub hop when Asset Hub is already the destination', async () => {
    const cgtAsset = {
      ...mockAsset,
      symbol: 'CGT',
      location: {
        parents: 2,
        interior: {
          X2: [
            { GlobalConsensus: { Ethereum: { chainId: 1 } } },
            {
              AccountKey20: {
                network: null,
                key: '0x0e186357c323c806c1efdad36d217f7a54b63d18'
              }
            }
          ]
        }
      } as TLocation
    }
    const options = {
      ...mockOptions,
      chain: 'Jamton' as const,
      destination: 'AssetHubPolkadot' as const,
      assetInfo: cgtAsset
    }
    getAssetReserveChainSpy.mockReturnValue('AssetHubPolkadot')

    const result = await createTypeAndThenCallContext(options, {})

    expect(result.reserve.chain).toBe('AssetHubPolkadot')
    expect(result.dest.chain).toBe('AssetHubPolkadot')
    expect(result.bridgeHopChain).toBeUndefined()
  })

  it('resolves an external reserve only when the destination is external', async () => {
    vi.mocked(isExternalChain).mockImplementation(chain => chain === 'Ethereum')
    getAssetReserveChainSpy.mockReturnValue('Ethereum')

    const options = {
      ...mockOptions,
      destination: 'Ethereum' as const
    }

    const result = await createTypeAndThenCallContext(options, {})

    expect(getAssetReserveChainSpy).toHaveBeenCalledWith(mockChain, mockAsset.location, true)
    expect(result.reserve.chain).toBe('Ethereum')
  })

  it('should use origin api for reserve when reserveChain equals origin chain', async () => {
    getAssetReserveChainSpy.mockReturnValue(mockChain)

    const destApiClone = { init: vi.fn().mockResolvedValue(undefined) } as unknown as PolkadotApi<
      unknown,
      unknown,
      unknown
    >
    vi.spyOn(mockApi, 'clone').mockReturnValueOnce(destApiClone)

    const destInitSpy = vi.spyOn(destApiClone, 'init')
    const reserveInitSpy = vi.spyOn(mockApi, 'init')

    const result = await createTypeAndThenCallContext(mockOptions, {})

    expect(destInitSpy).toHaveBeenCalledWith(mockDestChain)
    expect(reserveInitSpy).toHaveBeenCalledWith(mockChain)

    expect(result.dest.api).toBe(destApiClone)
    expect(result.reserve.api).toBe(mockApi)
    expect(result.reserve.chain).toBe(mockChain)
  })

  it('marks assets located on the relay as relay assets', async () => {
    const relayAsset = {
      ...mockAsset,
      location: RELAY_LOCATION
    }

    const options = {
      ...mockOptions,
      assetInfo: relayAsset
    }

    const result = await createTypeAndThenCallContext(options, {})

    expect(result.isRelayAsset).toBe(true)
  })

  it('uses the bridge reserve when crossing a substrate bridge', async () => {
    vi.mocked(isSubstrateBridge).mockReturnValue(true)

    const result = await createTypeAndThenCallContext(mockOptions, {})

    expect(getAssetReserveChainSpy).not.toHaveBeenCalled()
    expect(result.isSubBridge).toBe(true)
    expect(result.isRelayAsset).toBe(true)
    expect(result.reserve.chain).toBe(mockChain)
  })

  it('uses the override reserve chain when provided', async () => {
    const overrideChain: TSubstrateChain = 'Hydration'

    const result = await createTypeAndThenCallContext(mockOptions, {
      reserveChain: overrideChain
    })

    expect(getAssetReserveChainSpy).not.toHaveBeenCalled()
    expect(result.reserve.chain).toBe(overrideChain)
  })

  it('does not mark foreign-relay assets as relay assets when going to an external chain', async () => {
    vi.mocked(isExternalChain).mockImplementation(c => c === 'Ethereum')

    const foreignRelayAsset = {
      ...mockAsset,
      location: {
        parents: 2,
        interior: { X1: [{ GlobalConsensus: { kusama: null } }] }
      }
    }

    const options = {
      ...mockOptions,
      chain: 'Hydration' as const,
      destination: 'Ethereum' as const,
      assetInfo: foreignRelayAsset
    }

    const result = await createTypeAndThenCallContext(options, {})

    expect(result.isRelayAsset).toBe(false)
  })

  describe('getFeeAssetLocation', () => {
    const assetLocation: TLocation = { parents: 1, interior: { X1: { Parachain: 2000 } } }
    const feeLocation: TLocation = { parents: 1, interior: { X1: { Parachain: 1000 } } }
    const context = {
      assetInfo: { location: assetLocation }
    } as TTypeAndThenCallContext<unknown, unknown, unknown>

    it('prefers the user-defined fee asset', () => {
      expect(
        getFeeAssetLocation({
          ...context,
          isRelayAsset: false,
          feeAssetInfo: { location: feeLocation } as TAssetInfo
        })
      ).toBe(feeLocation)
    })

    it('uses the transferred asset when it pays its own fees', () => {
      expect(getFeeAssetLocation({ ...context, isRelayAsset: true })).toBe(assetLocation)
    })

    it('falls back to the relay asset', () => {
      expect(getFeeAssetLocation({ ...context, isRelayAsset: false })).toBe(RELAY_LOCATION)
    })
  })
})
