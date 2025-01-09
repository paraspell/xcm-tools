import type { MockInstance } from 'vitest'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { determineRelayChain, getNode } from '../utils'
import { transferRelayToPara } from './transferRelayToPara'
import type { IPolkadotApi } from '../api'
import type ParachainNode from '../nodes/ParachainNode'
import { getRelayChainSymbol } from '../pallets/assets'
import { resolveTNodeFromMultiLocation } from '../pallets/xcmPallet/utils'
import { Version, type TMultiLocation, type TRelayToParaOptions } from '../types'

vi.mock('../utils', () => ({
  determineRelayChain: vi.fn(),
  getNode: vi.fn()
}))

vi.mock('../pallets/assets', () => ({
  getRelayChainSymbol: vi.fn()
}))

vi.mock('../pallets/xcmPallet/utils', () => ({
  resolveTNodeFromMultiLocation: vi.fn()
}))

describe('transferRelayToPara', () => {
  let apiMock: IPolkadotApi<unknown, unknown>
  let nodeMock: ParachainNode<unknown, unknown>
  let consoleWarnSpy: MockInstance

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

    nodeMock = {
      transferRelayToPara: vi.fn().mockReturnValue('serializedApiCall')
    } as unknown as ParachainNode<unknown, unknown>

    vi.mocked(getNode).mockReturnValue(nodeMock)
    vi.mocked(determineRelayChain).mockReturnValue('Polkadot')
    vi.mocked(getRelayChainSymbol).mockReturnValue('DOT')
    vi.mocked(resolveTNodeFromMultiLocation).mockReturnValue('Acala')
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  it('should throw an error when api is undefined and destination is MultiLocation', async () => {
    const options: TRelayToParaOptions<unknown, unknown> = {
      api: apiMock,
      origin: 'Polkadot',
      destination: {} as TMultiLocation,
      asset: { symbol: 'DOT', amount: 100 },
      address: 'some-address'
    }

    vi.spyOn(apiMock, 'getApiOrUrl').mockReturnValue(undefined)
    const spy = vi.spyOn(apiMock, 'init')

    await expect(transferRelayToPara(options)).rejects.toThrow(
      'API is required when using MultiLocation as destination.'
    )

    expect(spy).not.toHaveBeenCalled()
  })

  it('should initialize api with the correct relay chain', async () => {
    const options: TRelayToParaOptions<unknown, unknown> = {
      api: apiMock,
      origin: 'Polkadot',
      destination: 'Astar',
      asset: { symbol: 'DOT', amount: 100 },
      address: 'some-address'
    }

    const spy = vi.spyOn(apiMock, 'init')

    await transferRelayToPara(options)

    expect(spy).toHaveBeenCalledWith('Polkadot')
  })

  it('should get the serialized api call correctly when destination is MultiLocation', async () => {
    const options: TRelayToParaOptions<unknown, unknown> = {
      api: apiMock,
      origin: 'Polkadot',
      destination: {} as TMultiLocation,
      asset: { symbol: 'DOT', amount: 100 },
      address: 'some-address'
    }

    const transferSpy = vi.spyOn(nodeMock, 'transferRelayToPara')
    const apiSpy = vi.spyOn(apiMock, 'callTxMethod')

    await transferRelayToPara(options)

    expect(resolveTNodeFromMultiLocation).toHaveBeenCalledWith('Polkadot', {})
    expect(getNode).toHaveBeenCalledWith('Acala')
    expect(transferSpy).toHaveBeenCalledWith({
      api: apiMock,
      origin: options.origin,
      destination: {},
      asset: options.asset,
      address: 'some-address'
    })
    expect(apiSpy).toHaveBeenCalledWith('serializedApiCall')
  })

  it('should get the serialized api call correctly when destination is not MultiLocation', async () => {
    const options: TRelayToParaOptions<unknown, unknown> = {
      api: apiMock,
      origin: 'Polkadot',
      destination: 'Astar',
      asset: { symbol: 'DOT', amount: 100 },
      address: 'some-address'
    }

    const transferSpy = vi.spyOn(nodeMock, 'transferRelayToPara')
    const apiSpy = vi.spyOn(apiMock, 'callTxMethod')

    await transferRelayToPara(options)

    expect(getNode).toHaveBeenCalledWith(options.destination)
    expect(transferSpy).toHaveBeenCalledWith({
      api: apiMock,
      origin: options.origin,
      destination: options.destination,
      asset: options.asset,
      address: options.address
    })
    expect(apiSpy).toHaveBeenCalledWith('serializedApiCall')
  })

  it('should handle exceptions', async () => {
    apiMock.callTxMethod = vi.fn().mockRejectedValue(new Error('Some error'))

    const options: TRelayToParaOptions<unknown, unknown> = {
      api: apiMock,
      origin: 'Polkadot',
      destination: 'Astar',
      asset: { symbol: 'DOT', amount: 100 },
      address: 'some-address'
    }

    await expect(transferRelayToPara(options)).rejects.toThrow('Some error')
  })

  it('should pass optional parameters when provided', async () => {
    const options: TRelayToParaOptions<unknown, unknown> = {
      api: apiMock,
      origin: 'Polkadot',
      destination: 'Astar',
      asset: { symbol: 'DOT', amount: 100 },
      address: 'some-address',
      paraIdTo: 2000,
      version: Version.V3
    }

    const transferSpy = vi.spyOn(nodeMock, 'transferRelayToPara')

    await transferRelayToPara(options)

    expect(transferSpy).toHaveBeenCalledWith({
      api: apiMock,
      origin: options.origin,
      destination: options.destination,
      asset: options.asset,
      address: options.address,
      paraIdTo: 2000,
      version: options.version
    })
  })
})
