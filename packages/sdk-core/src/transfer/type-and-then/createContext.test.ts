import type { TAssetWithLocation } from '@paraspell/assets'
import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'
import { isRelayChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { assertHasLocation, getAssetReserveChain, getRelayChainOf } from '../../utils'
import { createTypeAndThenCallContext } from './createContext'

vi.mock('@paraspell/sdk-common', () => ({
  isRelayChain: vi.fn()
}))

vi.mock('../../utils', () => ({
  assertHasLocation: vi.fn(),
  getAssetReserveChain: vi.fn(),
  getRelayChainOf: vi.fn()
}))

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

  const mockClonedApi = {
    init: vi.fn().mockResolvedValue(undefined)
  }

  const mockApi = {
    clone: vi.fn().mockReturnValue(mockClonedApi),
    init: vi.fn().mockResolvedValue(undefined)
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockOptions = {
    api: mockApi,
    destChain: mockDestChain,
    assetInfo: mockAsset
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(isRelayChain).mockReturnValue(false)
    vi.mocked(getAssetReserveChain).mockReturnValue(mockReserveChain)
    vi.mocked(assertHasLocation).mockReturnValue(undefined)
  })

  it('should create context with relay chain as destination', async () => {
    const relayDestChain: TSubstrateChain = 'Polkadot'
    vi.mocked(isRelayChain).mockReturnValue(true)

    const options = {
      ...mockOptions,
      destChain: relayDestChain
    }

    const result = await createTypeAndThenCallContext(mockChain, options)

    expect(getAssetReserveChain).not.toHaveBeenCalled()
    expect(mockClonedApi.init).toHaveBeenCalledTimes(2)

    expect(result).toEqual({
      origin: { api: mockApi, chain: mockChain },
      dest: { api: mockClonedApi, chain: relayDestChain },
      reserve: { api: mockClonedApi, chain: relayDestChain },
      assetInfo: mockAsset,
      options
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
