import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { getRelayChainSymbol } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api'
import type AssetHubPolkadot from '../chains/supported/AssetHubPolkadot'
import { TX_CLIENT_TIMEOUT_MS } from '../constants'
import { resolveTChainFromLocation } from '../pallets/xcmPallet/utils'
import { type TRelayToParaOptions } from '../types'
import { getChain, getRelayChainOf } from '../utils'
import { transferRelayToPara } from './transferRelayToPara'

vi.mock('@paraspell/assets')
vi.mock('../utils')
vi.mock('../pallets/xcmPallet/utils')

describe('transferRelayToPara', () => {
  let apiMock: IPolkadotApi<unknown, unknown>
  let chainMock: AssetHubPolkadot<unknown, unknown>

  const baseOptions = {
    origin: 'Polkadot',
    assetInfo: { symbol: 'DOT', amount: 100n } as WithAmount<TAssetInfo>,
    address: 'some-address',
    version: Version.V4
  } as Partial<TRelayToParaOptions<unknown, unknown>>

  beforeEach(() => {
    vi.clearAllMocks()

    apiMock = {
      init: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      deserializeExtrinsics: vi.fn().mockResolvedValue('callTxResult'),
      getConfig: vi.fn().mockReturnValue({}),
      clone: vi.fn().mockReturnValue({
        getApi: vi.fn().mockReturnValue({})
      }),
      getApi: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    baseOptions.api = apiMock

    chainMock = {
      transferRelayToPara: vi.fn().mockReturnValue('serializedApiCall')
    } as unknown as AssetHubPolkadot<unknown, unknown>

    vi.mocked(getChain).mockReturnValue(chainMock)
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(getRelayChainSymbol).mockReturnValue('DOT')
    vi.mocked(resolveTChainFromLocation).mockReturnValue('Acala')
  })

  it('should throw an error when destination is location', async () => {
    const options = {
      ...baseOptions,
      destination: {}
    } as TRelayToParaOptions<unknown, unknown>

    vi.spyOn(apiMock, 'getConfig').mockReturnValue(undefined)
    const spy = vi.spyOn(apiMock, 'init')

    await expect(transferRelayToPara(options)).rejects.toThrow(
      'API is required when using location as destination.'
    )
    expect(spy).not.toHaveBeenCalled()
  })

  it('should initialize api with the correct relay chain', async () => {
    const options = {
      ...baseOptions,
      destination: 'Astar'
    } as TRelayToParaOptions<unknown, unknown>

    const spy = vi.spyOn(apiMock, 'init')

    await transferRelayToPara(options)

    expect(spy).toHaveBeenCalledWith('Polkadot', TX_CLIENT_TIMEOUT_MS)
  })

  it('should get the serialized api call correctly when destination is location', async () => {
    const options = {
      ...baseOptions,
      destination: {}
    } as TRelayToParaOptions<unknown, unknown>

    const transferSpy = vi.spyOn(chainMock, 'transferRelayToPara')
    const apiSpy = vi.spyOn(apiMock, 'deserializeExtrinsics')

    await transferRelayToPara(options)

    expect(resolveTChainFromLocation).toHaveBeenCalledWith('Polkadot', {})
    expect(getChain).toHaveBeenCalledWith('Acala')
    expect(transferSpy).toHaveBeenCalledWith(expect.objectContaining(options))
    expect(apiSpy).toHaveBeenCalledWith('serializedApiCall')
  })

  it('should get the serialized api call correctly when destination is not location', async () => {
    const options = {
      ...baseOptions,
      destination: 'Astar'
    } as TRelayToParaOptions<unknown, unknown>

    const transferSpy = vi.spyOn(chainMock, 'transferRelayToPara')
    const apiSpy = vi.spyOn(apiMock, 'deserializeExtrinsics')

    await transferRelayToPara(options)

    expect(getChain).toHaveBeenCalledWith(options.destination)
    expect(transferSpy).toHaveBeenCalledWith(expect.objectContaining(options))
    expect(apiSpy).toHaveBeenCalledWith('serializedApiCall')
  })

  it('should handle exceptions', async () => {
    apiMock.deserializeExtrinsics = vi.fn().mockRejectedValue(new Error('Some error'))

    const options = {
      ...baseOptions,
      destination: 'Astar'
    } as TRelayToParaOptions<unknown, unknown>

    await expect(transferRelayToPara(options)).rejects.toThrow('Some error')
  })

  it('should pass optional parameters when provided', async () => {
    const options = {
      ...baseOptions,
      destination: 'Astar',
      paraIdTo: 2000
    } as TRelayToParaOptions<unknown, unknown>

    const transferSpy = vi.spyOn(chainMock, 'transferRelayToPara')

    await transferRelayToPara(options)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        ...options
      })
    )
  })
})
