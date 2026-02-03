import { findNativeAssetInfoOrThrow, type TAssetWithLocation } from '@paraspell/assets'
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

import type { IPolkadotApi } from '../../api'
import { RELAY_LOCATION } from '../../constants'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { assertHasLocation, getAssetReserveChain, getRelayChainOf } from '../../utils'
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
    const result = getBridgeReserve(originChain, destinationChain, RELAY_LOCATION)

    expect(result).toBe(originChain)
  })

  it('returns the origin chain when asset location differs from relay', () => {
    const parachainLocation: TLocation = {
      parents: 1,
      interior: { X1: { Parachain: 2000 } }
    }

    const result = getBridgeReserve(originChain, destinationChain, parachainLocation)

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

    const result = getBridgeReserve(originChain, 'Ethereum', ethLocation)

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

    const result = getBridgeReserve(originChain, 'Ethereum', mismatchLocation)

    expect(result).toBe(originChain)
  })

  it('returns destination when relay consensus matches location', () => {
    const relayLocation: TLocation = {
      parents: 2,
      interior: { X1: [{ GlobalConsensus: { kusama: null } }] }
    }

    const result = getBridgeReserve(originChain, destinationChain, relayLocation)

    expect(result).toBe(destinationChain)
  })
})

describe('createTypeAndThenCallContext', () => {
  const mockChain: TSubstrateChain = 'AssetHubPolkadot'
  const mockDestChain: TChain = 'Acala'
  const mockReserveChain: TSubstrateChain = 'Polkadot'

  const mockAsset = {
    amount: 1000n,
    symbol: 'DOT',
    decimals: 10,
    location: { parents: 1, interior: { X1: { Parachain: 2000 } } }
  } as TAssetWithLocation

  const mockSystemAsset = {
    symbol: 'DOT',
    decimals: 12,
    location: RELAY_LOCATION
  }

  const mockClonedApi = {
    init: vi.fn().mockResolvedValue(undefined)
  }

  const mockApi = {
    clone: vi.fn().mockReturnValue(mockClonedApi),
    init: vi.fn().mockResolvedValue(undefined)
  } as unknown as IPolkadotApi<unknown, unknown, unknown>

  const mockOptions = {
    api: mockApi,
    chain: mockChain,
    destination: mockDestChain,
    assetInfo: mockAsset
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(isRelayChain).mockReturnValue(false)
    vi.mocked(isSubstrateBridge).mockReturnValue(false)
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(getAssetReserveChain).mockReturnValue(mockReserveChain)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue(mockSystemAsset)
    vi.mocked(assertHasLocation).mockReturnValue(undefined)
  })

  it('should create context with relay chain as destination', async () => {
    const relayDestChain: TSubstrateChain = 'Polkadot'
    vi.mocked(isRelayChain).mockReturnValue(true)

    const options = {
      ...mockOptions,
      destination: relayDestChain
    }

    const result = await createTypeAndThenCallContext(options, {})

    expect(getAssetReserveChain).toHaveBeenCalled()
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

    expect(getAssetReserveChain).toHaveBeenCalledWith(mockChain, mockAsset.location)
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
    vi.mocked(getAssetReserveChain).mockReturnValue(mockChain)

    const destApiClone = { init: vi.fn().mockResolvedValue(undefined) } as unknown as IPolkadotApi<
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
    } as TAssetWithLocation

    const options = {
      ...mockOptions,
      assetInfo: relayAsset
    } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

    const result = await createTypeAndThenCallContext(options, {})

    expect(result.isRelayAsset).toBe(true)
  })
})
