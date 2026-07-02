import type { TAssetInfo, WithAmount } from '@paraspell/assets'
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
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getRelayChainOf } from '../../utils'
import { getEthereumJunction } from '../../utils/location/getEthereumJunction'
import { createTypeAndThenCallContext, getBridgeReserve } from './createContext'

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

  const mockClonedApi = {
    init: vi.fn().mockResolvedValue(undefined)
  }

  const mockApi = {
    clone: vi.fn().mockReturnValue(mockClonedApi),
    init: vi.fn().mockResolvedValue(undefined),
    findNativeAssetInfoOrThrow: vi.fn(),
    getAssetReserveChain: vi.fn(),
    getRelayChainOf: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  const findNativeAssetInfoOrThrowSpy = vi.spyOn(mockApi, 'findNativeAssetInfoOrThrow')
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

  it('should create context with non-relay chain as destination', async () => {
    const result = await createTypeAndThenCallContext(mockOptions, {})

    expect(getAssetReserveChainSpy).toHaveBeenCalledWith(mockChain, mockAsset.location, true)
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
})
