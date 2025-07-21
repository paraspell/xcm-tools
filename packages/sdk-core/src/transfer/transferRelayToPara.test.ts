import type { TAsset, WithAmount } from '@paraspell/assets'
import { getRelayChainSymbol } from '@paraspell/assets'
import { type TMultiLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api'
import { TX_CLIENT_TIMEOUT_MS } from '../constants'
import type AssetHubPolkadot from '../nodes/supported/AssetHubPolkadot'
import { resolveTNodeFromMultiLocation } from '../pallets/xcmPallet/utils'
import { type TRelayToParaOptions } from '../types'
import { getNode, getRelayChainOf } from '../utils'
import { transferRelayToPara } from './transferRelayToPara'

vi.mock('../utils', () => ({
  getRelayChainOf: vi.fn(),
  getNode: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  getRelayChainSymbol: vi.fn()
}))

vi.mock('../pallets/xcmPallet/utils', () => ({
  resolveTNodeFromMultiLocation: vi.fn()
}))

describe('transferRelayToPara', () => {
  let apiMock: IPolkadotApi<unknown, unknown>
  let nodeMock: AssetHubPolkadot<unknown, unknown>

  const baseOptions = {
    origin: 'Polkadot',
    asset: { symbol: 'DOT', amount: 100n } as WithAmount<TAsset>,
    address: 'some-address',
    version: Version.V4
  } as Partial<TRelayToParaOptions<unknown, unknown>>

  beforeEach(() => {
    vi.clearAllMocks()

    apiMock = {
      init: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      callTxMethod: vi.fn().mockResolvedValue('callTxResult'),
      getApiOrUrl: vi.fn().mockReturnValue({}),
      clone: vi.fn().mockReturnValue({
        getApi: vi.fn().mockReturnValue({})
      }),
      getApi: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    baseOptions.api = apiMock

    nodeMock = {
      transferRelayToPara: vi.fn().mockReturnValue('serializedApiCall')
    } as unknown as AssetHubPolkadot<unknown, unknown>

    vi.mocked(getNode).mockReturnValue(nodeMock)
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(getRelayChainSymbol).mockReturnValue('DOT')
    vi.mocked(resolveTNodeFromMultiLocation).mockReturnValue('Acala')
  })

  it('should throw an error when destination is MultiLocation', async () => {
    const options = {
      ...baseOptions,
      destination: {} as TMultiLocation
    } as TRelayToParaOptions<unknown, unknown>

    vi.spyOn(apiMock, 'getApiOrUrl').mockReturnValue(undefined)
    const spy = vi.spyOn(apiMock, 'init')

    await expect(transferRelayToPara(options)).rejects.toThrow(
      'API is required when using MultiLocation as destination.'
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

  it('should get the serialized api call correctly when destination is MultiLocation', async () => {
    const options = {
      ...baseOptions,
      destination: {} as TMultiLocation
    } as TRelayToParaOptions<unknown, unknown>

    const transferSpy = vi.spyOn(nodeMock, 'transferRelayToPara')
    const apiSpy = vi.spyOn(apiMock, 'callTxMethod')

    await transferRelayToPara(options)

    expect(resolveTNodeFromMultiLocation).toHaveBeenCalledWith('Polkadot', {})
    expect(getNode).toHaveBeenCalledWith('Acala')
    expect(transferSpy).toHaveBeenCalledWith(expect.objectContaining(options))
    expect(apiSpy).toHaveBeenCalledWith('serializedApiCall')
  })

  it('should get the serialized api call correctly when destination is not MultiLocation', async () => {
    const options = {
      ...baseOptions,
      destination: 'Astar'
    } as TRelayToParaOptions<unknown, unknown>

    const transferSpy = vi.spyOn(nodeMock, 'transferRelayToPara')
    const apiSpy = vi.spyOn(apiMock, 'callTxMethod')

    await transferRelayToPara(options)

    expect(getNode).toHaveBeenCalledWith(options.destination)
    expect(transferSpy).toHaveBeenCalledWith(expect.objectContaining(options))
    expect(apiSpy).toHaveBeenCalledWith('serializedApiCall')
  })

  it('should handle exceptions', async () => {
    apiMock.callTxMethod = vi.fn().mockRejectedValue(new Error('Some error'))

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

    const transferSpy = vi.spyOn(nodeMock, 'transferRelayToPara')

    await transferRelayToPara(options)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        ...options
      })
    )
  })
})
