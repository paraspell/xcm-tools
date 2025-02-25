import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { IPolkadotApi } from '../api'
import type ParachainNode from '../nodes/ParachainNode'
import { isBridgeTransfer } from './utils/isBridgeTransfer'
import { determineAssetCheckEnabled } from './utils/determineAssetCheckEnabled'
import { resolveAsset } from './utils/resolveAsset'
import { isOverrideMultiLocationSpecifier } from '../utils/multiLocation/isOverrideMultiLocationSpecifier'
import { send } from './transfer'
import {
  validateAssetSpecifiers,
  validateAssetSupport,
  validateCurrency,
  validateDestination
} from './utils/validationUtils'
import { validateDestinationAddress } from './utils/validateDestinationAddress'
import { getNode } from '../utils'
import type {
  TAsset,
  TCurrencyInput,
  TMultiLocationValueWithOverride,
  TSendOptions
} from '../types'

vi.mock('../utils', () => ({
  getNode: vi.fn(),
  isPjsClient: vi.fn(),
  isRelayChain: vi.fn()
}))

vi.mock('../utils/multiLocation/isOverrideMultiLocationSpecifier', () => ({
  isOverrideMultiLocationSpecifier: vi.fn()
}))

vi.mock('./utils/validateDestinationAddress', () => ({
  validateDestinationAddress: vi.fn()
}))

vi.mock('./utils/determineAssetCheckEnabled', () => ({
  determineAssetCheckEnabled: vi.fn()
}))

vi.mock('./utils/isBridgeTransfer', () => ({
  isBridgeTransfer: vi.fn()
}))

vi.mock('./utils/resolveAsset', () => ({
  resolveAsset: vi.fn()
}))

vi.mock('./utils/validationUtils', () => ({
  validateCurrency: vi.fn(),
  validateDestination: vi.fn(),
  validateAssetSpecifiers: vi.fn(),
  validateAssetSupport: vi.fn()
}))

describe('send', () => {
  let apiMock: IPolkadotApi<unknown, unknown>
  let originNodeMock: ParachainNode<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()

    apiMock = {
      init: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      getApi: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    originNodeMock = {
      transfer: vi.fn().mockResolvedValue('transferResult')
    } as unknown as ParachainNode<unknown, unknown>

    vi.mocked(getNode).mockReturnValue(originNodeMock)
    vi.mocked(isBridgeTransfer).mockReturnValue(false)
    vi.mocked(determineAssetCheckEnabled).mockReturnValue(true)
    vi.mocked(resolveAsset).mockReturnValue({ symbol: 'TEST' } as TAsset)
    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should perform the send operation successfully', async () => {
    const options = {
      api: apiMock,
      origin: 'Acala',
      currency: { symbol: 'TEST', amount: '100' },
      address: 'some-address',
      destination: 'Astar'
    } as TSendOptions<unknown, unknown>
    const transferSpy = vi.spyOn(originNodeMock, 'transfer')
    const apiSpy = vi.spyOn(apiMock, 'init')

    const result = await send(options)

    expect(validateCurrency).toHaveBeenCalledWith(options.currency)
    expect(validateDestination).toHaveBeenCalledWith(options.origin, options.destination)
    expect(validateDestinationAddress).toHaveBeenCalledWith(options.address, options.destination)
    expect(validateAssetSpecifiers).toHaveBeenCalledWith(true, options.currency)
    expect(validateAssetSupport).toHaveBeenCalledWith(options, true, false, { symbol: 'TEST' })

    expect(apiSpy).toHaveBeenCalledWith(options.origin)

    expect(transferSpy).toHaveBeenCalledWith({
      api: apiMock,
      asset: { symbol: 'TEST', amount: '100' },
      address: options.address,
      destination: options.destination,
      paraIdTo: options.paraIdTo,
      version: options.version
    })

    expect(result).toBe('transferResult')
  })

  it('should handle when assetCheckEnabled is false', async () => {
    vi.mocked(determineAssetCheckEnabled).mockReturnValue(false)
    vi.mocked(resolveAsset).mockReturnValue(null)

    const options = {
      api: apiMock,
      origin: 'Acala',
      destination: 'Astar',
      currency: { symbol: 'DOT', amount: '100' },
      address: 'some-address'
    } as TSendOptions<unknown, unknown>
    const transferSpy = vi.spyOn(originNodeMock, 'transfer')

    const result = await send(options)

    expect(validateAssetSpecifiers).toHaveBeenCalledWith(false, options.currency)
    expect(validateAssetSupport).toHaveBeenCalledWith(options, false, false, null)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        asset: { symbol: 'DOT', amount: '100' }
      })
    )

    expect(result).toBe('transferResult')
  })

  it('should handle exceptions', async () => {
    apiMock.init = vi.fn().mockRejectedValue(new Error('Initialization Error'))

    const options = {
      api: apiMock,
      origin: 'Acala',
      currency: { symbol: 'TEST', amount: 100 },
      address: 'some-address',
      destination: 'Astar'
    } as TSendOptions<unknown, unknown>

    const apiSpy = vi.spyOn(apiMock, 'init')

    await expect(send(options)).rejects.toThrow('Initialization Error')

    expect(apiSpy).toHaveBeenCalled()
  })

  it('should throw validation errors', async () => {
    vi.mocked(validateCurrency).mockImplementation(() => {
      throw new Error('Invalid currency')
    })

    const options = {
      api: apiMock,
      origin: 'Acala',
      currency: {
        amount: 100
      },
      address: 'some-address',
      destination: 'Astar'
    } as TSendOptions<unknown, unknown>

    await expect(send(options)).rejects.toThrow('Invalid currency')

    const apiSpy = vi.spyOn(apiMock, 'init')
    expect(apiSpy).not.toHaveBeenCalled()
  })

  it('should handle overriddenAsset when multilocation is present and isOverrideMultiLocationSpecifier returns true', async () => {
    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(true)

    const currency = { multilocation: { type: 'Override', value: {} } }

    const options = {
      api: apiMock,
      origin: 'Acala',
      currency: currency as {
        multilocation: TMultiLocationValueWithOverride
      },
      address: 'some-address',
      destination: 'Astar'
    } as TSendOptions<unknown, unknown>

    const transferSpy = vi.spyOn(originNodeMock, 'transfer')

    const result = await send(options)

    expect(isOverrideMultiLocationSpecifier).toHaveBeenCalledWith(currency.multilocation)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        overriddenAsset: {}
      })
    )

    expect(result).toBe('transferResult')
  })

  it('should handle overriddenAsset when multiasset is present', async () => {
    const options = {
      api: apiMock,
      origin: 'Acala',
      currency: { multiasset: [] } as TCurrencyInput,
      address: 'some-address',
      destination: 'Astar'
    } as TSendOptions<unknown, unknown>

    const transferSpy = vi.spyOn(originNodeMock, 'transfer')

    const result = await send(options)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        overriddenAsset: []
      })
    )

    expect(result).toBe('transferResult')
  })

  it('should throw error if senderAddress is in EVM format', async () => {
    const options = {
      api: apiMock,
      origin: 'Acala',
      currency: { symbol: 'TEST', amount: 100 },
      address: 'some-address',
      destination: 'Astar',
      senderAddress: '0x1501C1413e4178c38567Ada8945A80351F7B8496'
    } as TSendOptions<unknown, unknown>

    await expect(send(options)).rejects.toThrow()
  })

  it('should not include optional parameters if they are undefined', async () => {
    const options = {
      api: apiMock,
      origin: 'Acala',
      currency: { symbol: 'TEST', amount: 100 },
      address: 'some-address',
      destination: 'Astar',
      paraIdTo: undefined,
      version: undefined,
      senderAddress: undefined
    } as TSendOptions<unknown, unknown>

    const transferSpy = vi.spyOn(originNodeMock, 'transfer')

    const result = await send(options)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        paraIdTo: undefined,
        version: undefined,
        senderAddress: undefined
      })
    )

    expect(result).toBe('transferResult')
  })
})
