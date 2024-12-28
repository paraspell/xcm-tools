import type { MockInstance } from 'vitest'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { determineRelayChain, getNode } from '../utils'
import { isPjsClient } from '../utils/isPjsClient'
import { transferRelayToPara } from './transferRelayToPara'
import type { IPolkadotApi } from '../api'
import type ParachainNode from '../nodes/ParachainNode'
import { getRelayChainSymbol } from '../pallets/assets'
import { resolveTNodeFromMultiLocation } from '../pallets/xcmPallet/utils'
import { Version, type TMultiLocation, type TRelayToParaOptions } from '../types'
import { checkKeepAlive } from './keepAlive'

vi.mock('../utils', () => ({
  determineRelayChain: vi.fn(),
  getNode: vi.fn()
}))

vi.mock('../utils/isPjsClient', () => ({
  isPjsClient: vi.fn()
}))

vi.mock('../pallets/assets', () => ({
  getRelayChainSymbol: vi.fn()
}))

vi.mock('./keepAlive', () => ({
  checkKeepAlive: vi.fn()
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
    vi.mocked(isPjsClient).mockReturnValue(true)
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

  it('should log a warning and not call checkKeepAlive when destination is MultiLocation', async () => {
    const options = {
      api: apiMock,
      origin: 'Polkadot',
      destination: {},
      asset: { symbol: 'DOT', amount: 100 },
      address: 'some-address'
    } as TRelayToParaOptions<unknown, unknown>

    await transferRelayToPara(options)

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Keep alive check is not supported when using MultiLocation as destination.'
    )
    expect(checkKeepAlive).not.toHaveBeenCalled()
  })

  it('should log a warning and not call checkKeepAlive when address is MultiLocation', async () => {
    const options: TRelayToParaOptions<unknown, unknown> = {
      api: apiMock,
      origin: 'Polkadot',
      destination: 'Astar',
      asset: { symbol: 'DOT', amount: 100 },
      address: {} as TMultiLocation,
      destApiForKeepAlive: apiMock
    }

    await transferRelayToPara(options)

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Keep alive check is not supported when using MultiLocation as address.'
    )
    expect(checkKeepAlive).not.toHaveBeenCalled()
  })

  it('should call checkKeepAlive when destination and address are not MultiLocation', async () => {
    const options: TRelayToParaOptions<unknown, unknown> = {
      api: apiMock,
      origin: 'Polkadot',
      destination: 'Astar',
      asset: { symbol: 'DOT', amount: 100 },
      address: 'some-address',
      destApiForKeepAlive: apiMock
    }

    await transferRelayToPara(options)

    expect(checkKeepAlive).toHaveBeenCalledWith({
      api: apiMock,
      origin: options.origin,
      destination: options.destination,
      address: options.address,
      destApi: options.destApiForKeepAlive,
      asset: options.asset
    })
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

  it('should disconnect api if isPjsClient returns true', async () => {
    vi.mocked(isPjsClient).mockReturnValue(true)
    const options: TRelayToParaOptions<unknown, unknown> = {
      api: apiMock,
      origin: 'Polkadot',
      destination: 'Astar',
      asset: { symbol: 'DOT', amount: 100 },
      address: 'some-address'
    }

    const apiSpy = vi.spyOn(apiMock, 'disconnect')

    await transferRelayToPara(options)

    expect(isPjsClient).toHaveBeenCalledWith(apiMock.getApi())
    expect(apiSpy).toHaveBeenCalled()
  })

  it('should not disconnect api if isPjsClient returns false', async () => {
    vi.mocked(isPjsClient).mockReturnValue(false)
    const options: TRelayToParaOptions<unknown, unknown> = {
      api: apiMock,
      origin: 'Polkadot',
      destination: 'Astar',
      asset: { symbol: 'DOT', amount: 100 },
      address: 'some-address'
    }

    const spy = vi.spyOn(apiMock, 'disconnect')

    await transferRelayToPara(options)

    expect(isPjsClient).toHaveBeenCalledWith(apiMock.getApi())
    expect(spy).not.toHaveBeenCalled()
  })

  it('should handle exceptions and still disconnect api if isPjsClient returns true', async () => {
    vi.mocked(isPjsClient).mockReturnValue(true)
    apiMock.callTxMethod = vi.fn().mockRejectedValue(new Error('Some error'))

    const options: TRelayToParaOptions<unknown, unknown> = {
      api: apiMock,
      origin: 'Polkadot',
      destination: 'Astar',
      asset: { symbol: 'DOT', amount: 100 },
      address: 'some-address'
    }

    const apiSpy = vi.spyOn(apiMock, 'disconnect')

    await expect(transferRelayToPara(options)).rejects.toThrow('Some error')

    expect(apiSpy).toHaveBeenCalled()
  })

  it('should pass optional parameters when provided', async () => {
    const destApiMock = {
      init: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      callTxMethod: vi.fn().mockResolvedValue('callTxResult'),
      getApi: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    const options: TRelayToParaOptions<unknown, unknown> = {
      api: apiMock,
      origin: 'Polkadot',
      destination: 'Astar',
      asset: { symbol: 'DOT', amount: 100 },
      address: 'some-address',
      paraIdTo: 2000,
      destApiForKeepAlive: destApiMock,
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
      destApiForKeepAlive: destApiMock,
      version: options.version
    })
  })
})
