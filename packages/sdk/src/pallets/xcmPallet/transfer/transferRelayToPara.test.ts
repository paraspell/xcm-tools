import type { MockInstance } from 'vitest'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { determineRelayChain, getNode } from '../../../utils'
import { isPjsClient } from '../../../utils/isPjsClient'
import { getRelayChainSymbol } from '../../assets'
import { checkKeepAlive } from '../keepAlive'
import { resolveTNodeFromMultiLocation } from '../utils'
import type { IPolkadotApi } from '../../../api'
import { Version, type Extrinsic, type TPjsApi, type TRelayToParaOptions } from '../../../pjs'
import type ParachainNode from '../../../nodes/ParachainNode'
import { transferRelayToPara } from './transferRelayToPara'

vi.mock('../../../utils', () => ({
  determineRelayChain: vi.fn(),
  getNode: vi.fn()
}))

vi.mock('../../../utils/isPjsClient', () => ({
  isPjsClient: vi.fn()
}))

vi.mock('../../assets', () => ({
  getRelayChainSymbol: vi.fn()
}))

vi.mock('../keepAlive', () => ({
  checkKeepAlive: vi.fn()
}))

vi.mock('../utils', () => ({
  resolveTNodeFromMultiLocation: vi.fn()
}))

describe('transferRelayToPara', () => {
  let apiMock: IPolkadotApi<TPjsApi, Extrinsic>
  let nodeMock: ParachainNode<TPjsApi, Extrinsic>
  let consoleWarnSpy: MockInstance

  beforeEach(() => {
    vi.clearAllMocks()
    apiMock = {
      init: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      callTxMethod: vi.fn().mockResolvedValue('callTxResult'),
      getApiOrUrl: vi.fn().mockReturnValue({})
    } as unknown as IPolkadotApi<TPjsApi, Extrinsic>

    nodeMock = {
      transferRelayToPara: vi.fn().mockReturnValue('serializedApiCall')
    } as unknown as ParachainNode<TPjsApi, Extrinsic>

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
    const options = {
      api: apiMock,
      destination: {},
      amount: 100,
      address: 'some-address'
    } as TRelayToParaOptions<TPjsApi, Extrinsic>

    vi.spyOn(apiMock, 'getApiOrUrl').mockReturnValue(undefined)
    const spy = vi.spyOn(apiMock, 'init')

    await expect(transferRelayToPara(options)).rejects.toThrow(
      'API is required when using MultiLocation as destination.'
    )

    expect(spy).not.toHaveBeenCalled()
  })

  it('should initialize api with the correct relay chain', async () => {
    const options = {
      api: apiMock,
      destination: 'Astar',
      amount: 100,
      address: 'some-address'
    } as TRelayToParaOptions<TPjsApi, Extrinsic>

    const spy = vi.spyOn(apiMock, 'init')

    await transferRelayToPara(options)

    expect(determineRelayChain).toHaveBeenCalledWith(options.destination)
    expect(spy).toHaveBeenCalledWith('Polkadot')
  })

  it('should log a warning and not call checkKeepAlive when destination is MultiLocation', async () => {
    const options = {
      api: apiMock,
      destination: {},
      amount: 100,
      address: 'some-address'
    } as TRelayToParaOptions<TPjsApi, Extrinsic>

    await transferRelayToPara(options)

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Keep alive check is not supported when using MultiLocation as destination.'
    )
    expect(checkKeepAlive).not.toHaveBeenCalled()
  })

  it('should log a warning and not call checkKeepAlive when address is MultiLocation', async () => {
    const options = {
      api: apiMock,
      destination: 'Astar',
      amount: 100,
      address: {}
    } as TRelayToParaOptions<TPjsApi, Extrinsic>

    await transferRelayToPara(options)

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Keep alive check is not supported when using MultiLocation as address.'
    )
    expect(checkKeepAlive).not.toHaveBeenCalled()
  })

  it('should call checkKeepAlive when destination and address are not MultiLocation', async () => {
    const options = {
      api: apiMock,
      destination: 'Astar',
      amount: 100,
      address: 'some-address'
    } as TRelayToParaOptions<TPjsApi, Extrinsic>

    await transferRelayToPara(options)

    expect(getRelayChainSymbol).toHaveBeenCalledWith(options.destination)
    expect(checkKeepAlive).toHaveBeenCalledWith({
      originApi: apiMock,
      address: options.address,
      amount: '100',
      destApi: options.destApiForKeepAlive,
      asset: { symbol: 'DOT' },
      destNode: options.destination
    })
  })

  it('should get the serialized api call correctly when destination is MultiLocation', async () => {
    const options = {
      api: apiMock,
      destination: {},
      amount: 100,
      address: 'some-address'
    } as TRelayToParaOptions<TPjsApi, Extrinsic>

    const transferSpy = vi.spyOn(nodeMock, 'transferRelayToPara')
    const apiSpy = vi.spyOn(apiMock, 'callTxMethod')

    await transferRelayToPara(options)

    expect(resolveTNodeFromMultiLocation).toHaveBeenCalledWith({})
    expect(getNode).toHaveBeenCalledWith('Acala')
    expect(transferSpy).toHaveBeenCalledWith({
      api: apiMock,
      destination: {},
      address: 'some-address',
      amount: '100',
      paraIdTo: undefined,
      destApiForKeepAlive: undefined,
      version: undefined
    })
    expect(apiSpy).toHaveBeenCalledWith('serializedApiCall')
  })

  it('should get the serialized api call correctly when destination is not MultiLocation', async () => {
    const options = {
      api: apiMock,
      destination: 'Astar',
      amount: 100,
      address: 'some-address'
    } as TRelayToParaOptions<TPjsApi, Extrinsic>

    const transferSpy = vi.spyOn(nodeMock, 'transferRelayToPara')
    const apiSpy = vi.spyOn(apiMock, 'callTxMethod')

    await transferRelayToPara(options)

    expect(getNode).toHaveBeenCalledWith(options.destination)
    expect(transferSpy).toHaveBeenCalledWith({
      api: apiMock,
      destination: options.destination,
      address: options.address,
      amount: '100',
      paraIdTo: undefined,
      destApiForKeepAlive: undefined,
      version: undefined
    })
    expect(apiSpy).toHaveBeenCalledWith('serializedApiCall')
  })

  it('should disconnect api if isPjsClient returns true', async () => {
    vi.mocked(isPjsClient).mockReturnValue(true)
    const options = {
      api: apiMock,
      destination: 'Astar',
      amount: 100,
      address: 'some-address'
    } as TRelayToParaOptions<TPjsApi, Extrinsic>

    const apiSpy = vi.spyOn(apiMock, 'disconnect')

    await transferRelayToPara(options)

    expect(isPjsClient).toHaveBeenCalledWith(apiMock)
    expect(apiSpy).toHaveBeenCalled()
  })

  it('should not disconnect api if isPjsClient returns false', async () => {
    vi.mocked(isPjsClient).mockReturnValue(false)
    const options = {
      api: apiMock,
      destination: 'Astar',
      amount: 100,
      address: 'some-address'
    } as TRelayToParaOptions<TPjsApi, Extrinsic>

    const spy = vi.spyOn(apiMock, 'disconnect')

    await transferRelayToPara(options)

    expect(isPjsClient).toHaveBeenCalledWith(apiMock)
    expect(spy).not.toHaveBeenCalled()
  })

  it('should handle exceptions and still disconnect api if isPjsClient returns true', async () => {
    vi.mocked(isPjsClient).mockReturnValue(true)
    apiMock.callTxMethod = vi.fn().mockRejectedValue(new Error('Some error'))

    const options = {
      api: apiMock,
      destination: 'Astar',
      amount: 100,
      address: 'some-address'
    } as TRelayToParaOptions<TPjsApi, Extrinsic>

    const apiSpy = vi.spyOn(apiMock, 'disconnect')

    await expect(transferRelayToPara(options)).rejects.toThrow('Some error')

    expect(apiSpy).toHaveBeenCalled()
  })

  it('should pass optional parameters when provided', async () => {
    const destApiMock = {
      init: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      callTxMethod: vi.fn().mockResolvedValue('callTxResult')
    } as unknown as IPolkadotApi<TPjsApi, Extrinsic>

    const options = {
      api: apiMock,
      destination: 'Astar',
      amount: 100,
      address: 'some-address',
      paraIdTo: 2000,
      destApiForKeepAlive: destApiMock,
      version: Version.V3
    } as TRelayToParaOptions<TPjsApi, Extrinsic>

    const transferSpy = vi.spyOn(nodeMock, 'transferRelayToPara')

    await transferRelayToPara(options)

    expect(transferSpy).toHaveBeenCalledWith({
      api: apiMock,
      destination: options.destination,
      address: options.address,
      amount: '100',
      paraIdTo: 2000,
      destApiForKeepAlive: destApiMock,
      version: options.version
    })
  })
})
