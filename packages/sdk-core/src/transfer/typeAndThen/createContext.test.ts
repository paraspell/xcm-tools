import type { TAssetWithLocation } from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains, TNodePolkadotKusama } from '@paraspell/sdk-common'
import { isRelayChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { getTChain } from '../../chains/getTChain'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { assertHasLocation, getAssetReserveChain, getRelayChainOf } from '../../utils'
import { createTypeAndThenCallContext } from './createContext'

vi.mock('@paraspell/sdk-common', () => ({
  isRelayChain: vi.fn()
}))

vi.mock('../../chains/getTChain', () => ({
  getTChain: vi.fn()
}))

vi.mock('../../utils', () => ({
  assertHasLocation: vi.fn(),
  getAssetReserveChain: vi.fn(),
  getRelayChainOf: vi.fn()
}))

describe('createTypeAndThenCallContext', () => {
  const mockChain = 'AssetHubPolkadot' as TNodeDotKsmWithRelayChains
  const mockDestChain = 'Acala' as TNodePolkadotKusama
  const mockReserveChain = 'Polkadot' as TNodePolkadotKusama

  const mockAsset = {
    amount: 1000n,
    symbol: 'DOT',
    location: { parents: 1, interior: { X1: { Parachain: 2000 } } }
  } as TAssetWithLocation

  const mockClonedApi = {
    init: vi.fn().mockResolvedValue(undefined)
  }

  const mockApi = {
    clone: vi.fn().mockReturnValue(mockClonedApi),
    init: vi.fn().mockResolvedValue(undefined)
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockOptions = {
    api: mockApi,
    paraIdTo: 2000,
    assetInfo: mockAsset
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(getTChain).mockReturnValue(mockDestChain)
    vi.mocked(isRelayChain).mockReturnValue(false)
    vi.mocked(getAssetReserveChain).mockReturnValue(mockReserveChain)
    vi.mocked(assertHasLocation).mockReturnValue(undefined)
  })

  it('should create context with relay chain as destination', async () => {
    const relayDestChain = 'Polkadot' as TNodePolkadotKusama
    vi.mocked(getTChain).mockReturnValue(relayDestChain)
    vi.mocked(isRelayChain).mockReturnValue(true)

    const result = await createTypeAndThenCallContext(mockChain, mockOptions)

    expect(getAssetReserveChain).not.toHaveBeenCalled()
    expect(mockClonedApi.init).toHaveBeenCalledTimes(2)
    expect(mockClonedApi.init).toHaveBeenCalledWith(relayDestChain)

    expect(result).toEqual({
      origin: { api: mockApi, chain: mockChain },
      dest: { api: mockClonedApi, chain: relayDestChain },
      reserve: { api: mockClonedApi, chain: relayDestChain },
      assetInfo: mockAsset,
      options: mockOptions
    })
  })

  it('should create context with non-relay chain as destination', async () => {
    const result = await createTypeAndThenCallContext(mockChain, mockOptions)

    expect(getAssetReserveChain).toHaveBeenCalledWith(mockChain, mockChain, mockAsset.location)
    expect(mockClonedApi.init).toHaveBeenNthCalledWith(1, mockDestChain)
    expect(mockClonedApi.init).toHaveBeenNthCalledWith(2, mockReserveChain)

    expect(result).toEqual({
      origin: { api: mockApi, chain: mockChain },
      dest: { api: mockClonedApi, chain: mockDestChain },
      reserve: { api: mockClonedApi, chain: mockReserveChain },
      assetInfo: mockAsset,
      options: mockOptions
    })
  })

  it('should use destApi for reserve when reserveChain equals origin chain', async () => {
    vi.mocked(getAssetReserveChain).mockReturnValue(mockChain)

    const destApiClone = { init: vi.fn().mockResolvedValue(undefined) } as unknown as IPolkadotApi<
      unknown,
      unknown
    >
    const cloneSpy = vi.spyOn(mockApi, 'clone').mockReturnValueOnce(destApiClone)
    const initSpy = vi.spyOn(destApiClone, 'init')

    const result = await createTypeAndThenCallContext(mockChain, mockOptions)

    expect(cloneSpy).toHaveBeenCalledTimes(1)
    expect(initSpy).toHaveBeenCalledTimes(2)
    expect(result.dest.api).toBe(destApiClone)
    expect(result.reserve.api).toBe(destApiClone)
    expect(result.reserve.chain).toBe(mockChain)
  })

  it('should throw if asset has no location', async () => {
    const invalidOptions = {
      ...mockOptions,
      assetInfo: { amount: 1000n }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(assertHasLocation).mockImplementation(() => {
      throw new Error('Asset has no location')
    })

    await expect(createTypeAndThenCallContext(mockChain, invalidOptions)).rejects.toThrow(
      'Asset has no location'
    )
  })
})
