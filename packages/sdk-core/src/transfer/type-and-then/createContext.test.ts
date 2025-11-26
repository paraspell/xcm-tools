import { findNativeAssetInfoOrThrow, type TAssetWithLocation } from '@paraspell/assets'
import {
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
import { createTypeAndThenCallContext, getSubBridgeReserve } from './createContext'

vi.mock('@paraspell/sdk-common', async importOriginal => ({
  ...(await importOriginal()),
  isRelayChain: vi.fn(),
  isSubstrateBridge: vi.fn(),
  isTLocation: vi.fn()
}))

vi.mock('@paraspell/assets')

vi.mock('../../utils')
vi.mock('../../constants', () => ({
  RELAY_LOCATION: {
    parents: 1,
    interior: { Here: null }
  }
}))

describe('getSubBridgeReserve', () => {
  const originChain: TSubstrateChain = 'BridgeHubPolkadot'
  const destinationChain: TSubstrateChain = 'BridgeHubKusama'

  it('returns the origin chain when asset location is relay', () => {
    const result = getSubBridgeReserve(originChain, destinationChain, RELAY_LOCATION)

    expect(result).toBe(originChain)
  })

  it('returns the destination chain when asset location differs from relay', () => {
    const parachainLocation: TLocation = {
      parents: 1,
      interior: { X1: { Parachain: 2000 } }
    }

    const result = getSubBridgeReserve(originChain, destinationChain, parachainLocation)

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
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockOptions = {
    api: mockApi,
    destination: mockDestChain,
    assetInfo: mockAsset
  } as TPolkadotXCMTransferOptions<unknown, unknown>

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

    const result = await createTypeAndThenCallContext(mockChain, options)

    expect(getAssetReserveChain).toHaveBeenCalled()
    expect(mockClonedApi.init).toHaveBeenCalledTimes(2)

    expect(result).toEqual({
      origin: { api: mockApi, chain: mockChain },
      dest: { api: mockClonedApi, chain: relayDestChain },
      reserve: { api: mockClonedApi, chain: relayDestChain },
      isSubBridge: false,
      isRelayAsset: false,
      assetInfo: mockAsset,
      systemAsset: mockSystemAsset,
      options
    })
  })

  it('should create context with non-relay chain as destination', async () => {
    const result = await createTypeAndThenCallContext(mockChain, mockOptions)

    expect(getAssetReserveChain).toHaveBeenCalledWith(mockChain, mockAsset.location)
    expect(mockClonedApi.init).toHaveBeenNthCalledWith(1, mockDestChain)
    expect(mockClonedApi.init).toHaveBeenNthCalledWith(2, mockReserveChain)

    expect(result).toEqual({
      origin: { api: mockApi, chain: mockChain },
      dest: { api: mockClonedApi, chain: mockDestChain },
      reserve: { api: mockClonedApi, chain: mockReserveChain },
      isSubBridge: false,
      isRelayAsset: false,
      assetInfo: mockAsset,
      systemAsset: mockSystemAsset,
      options: mockOptions
    })
  })

  it('should use origin api for reserve when reserveChain equals origin chain', async () => {
    vi.mocked(getAssetReserveChain).mockReturnValue(mockChain)

    const destApiClone = { init: vi.fn().mockResolvedValue(undefined) } as unknown as IPolkadotApi<
      unknown,
      unknown
    >
    vi.spyOn(mockApi, 'clone').mockReturnValueOnce(destApiClone)

    const destInitSpy = vi.spyOn(destApiClone, 'init')
    const reserveInitSpy = vi.spyOn(mockApi, 'init')

    const result = await createTypeAndThenCallContext(mockChain, mockOptions)

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
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const result = await createTypeAndThenCallContext(mockChain, options)

    expect(result.isRelayAsset).toBe(true)
  })
})
