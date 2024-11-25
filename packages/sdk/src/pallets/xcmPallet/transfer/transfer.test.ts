import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { IPolkadotApi } from '../../../api'
import type { TCurrencyInput, TMultiLocationValueWithOverride, TSendOptions } from '../../../pjs'
import { type Extrinsic, type TPjsApi } from '../../../pjs'
import type ParachainNode from '../../../nodes/ParachainNode'
import { isBridgeTransfer } from './isBridgeTransfer'
import { determineAssetCheckEnabled } from './determineAssetCheckEnabled'
import { resolveAsset } from './resolveAsset'
import { isOverrideMultiLocationSpecifier } from '../../../utils/multiLocation/isOverrideMultiLocationSpecifier'
import { send } from './transfer'
import {
  validateAssetSpecifiers,
  validateAssetSupport,
  validateCurrency,
  validateDestination
} from './validationUtils'
import { validateDestinationAddress } from './validateDestinationAddress'
import { performKeepAliveCheck } from './performKeepAliveCheck'
import { getNode } from '../../../utils'
import { isPjsClient } from '../../../utils/isPjsClient'

vi.mock('../../../utils', () => ({
  getNode: vi.fn(),
  isPjsClient: vi.fn()
}))

vi.mock('../../../utils/isPjsClient', () => ({
  isPjsClient: vi.fn()
}))

vi.mock('../../../utils/multiLocation/isOverrideMultiLocationSpecifier', () => ({
  isOverrideMultiLocationSpecifier: vi.fn()
}))

vi.mock('./validateDestinationAddress', () => ({
  validateDestinationAddress: vi.fn()
}))

vi.mock('./determineAssetCheckEnabled', () => ({
  determineAssetCheckEnabled: vi.fn()
}))

vi.mock('./isBridgeTransfer', () => ({
  isBridgeTransfer: vi.fn()
}))

vi.mock('./performKeepAliveCheck', () => ({
  performKeepAliveCheck: vi.fn()
}))

vi.mock('./resolveAsset', () => ({
  resolveAsset: vi.fn()
}))

vi.mock('./validationUtils', () => ({
  validateCurrency: vi.fn(),
  validateDestination: vi.fn(),
  validateAssetSpecifiers: vi.fn(),
  validateAssetSupport: vi.fn()
}))

describe('send', () => {
  let apiMock: IPolkadotApi<TPjsApi, Extrinsic>
  let originNodeMock: ParachainNode<TPjsApi, Extrinsic>

  beforeEach(() => {
    vi.clearAllMocks()

    apiMock = {
      init: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined)
    } as unknown as IPolkadotApi<TPjsApi, Extrinsic>

    originNodeMock = {
      transfer: vi.fn().mockResolvedValue('transferResult')
    } as unknown as ParachainNode<TPjsApi, Extrinsic>

    vi.mocked(getNode).mockReturnValue(originNodeMock)

    vi.mocked(isPjsClient).mockReturnValue(true)

    vi.mocked(isBridgeTransfer).mockReturnValue(false)
    vi.mocked(determineAssetCheckEnabled).mockReturnValue(true)
    vi.mocked(resolveAsset).mockReturnValue({ symbol: 'TEST' })
    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should perform the send operation successfully', async () => {
    const options = {
      api: apiMock,
      origin: 'Acala',
      currency: { symbol: 'TEST' },
      amount: 100,
      address: 'some-address',
      destination: 'Astar'
    } as TSendOptions<TPjsApi, Extrinsic>
    const transferSpy = vi.spyOn(originNodeMock, 'transfer')
    const apiSpy = vi.spyOn(apiMock, 'init')
    const apiDisconnectSpy = vi.spyOn(apiMock, 'disconnect')

    const result = await send(options)

    expect(validateCurrency).toHaveBeenCalledWith(options.currency, options.amount, undefined)
    expect(validateDestination).toHaveBeenCalledWith(options.origin, options.destination)
    expect(validateDestinationAddress).toHaveBeenCalledWith(options.address, options.destination)
    expect(validateAssetSpecifiers).toHaveBeenCalledWith(true, options.currency)
    expect(validateAssetSupport).toHaveBeenCalledWith(options, true, false, { symbol: 'TEST' })

    expect(apiSpy).toHaveBeenCalledWith(options.origin)

    expect(performKeepAliveCheck).toHaveBeenCalledWith(options, { symbol: 'TEST' })

    expect(transferSpy).toHaveBeenCalledWith({
      api: apiMock,
      asset: { symbol: 'TEST' },
      amount: '100',
      address: options.address,
      destination: options.destination,
      paraIdTo: options.paraIdTo,
      overridedCurrencyMultiLocation: undefined,
      feeAsset: undefined,
      version: options.version,
      destApiForKeepAlive: options.destApiForKeepAlive,
      ahAddress: options.ahAddress
    })

    expect(isPjsClient).toHaveBeenCalledWith(apiMock)

    expect(apiDisconnectSpy).toHaveBeenCalled()

    expect(result).toBe('transferResult')
  })

  it('should handle when assetCheckEnabled is false', async () => {
    vi.mocked(determineAssetCheckEnabled).mockReturnValue(false)
    vi.mocked(resolveAsset).mockReturnValue(null)

    const options = {
      api: apiMock,
      origin: 'Acala',
      currency: { symbol: 'TEST' },
      amount: 100,
      address: 'some-address',
      destination: 'Astar'
    } as TSendOptions<TPjsApi, Extrinsic>

    const transferSpy = vi.spyOn(originNodeMock, 'transfer')

    const result = await send(options)

    expect(validateAssetSpecifiers).toHaveBeenCalledWith(false, options.currency)
    expect(validateAssetSupport).toHaveBeenCalledWith(options, false, false, null)

    expect(performKeepAliveCheck).toHaveBeenCalledWith(options, null)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        asset: { symbol: 'TEST' }
      })
    )

    expect(result).toBe('transferResult')
  })

  it('should not disconnect if api is not a PjsClient', async () => {
    vi.mocked(isPjsClient).mockReturnValue(false)

    const options = {
      api: apiMock,
      origin: 'Acala',
      currency: { symbol: 'TEST' },
      amount: 100,
      address: 'some-address',
      destination: 'Astar'
    } as TSendOptions<TPjsApi, Extrinsic>

    const result = await send(options)

    expect(isPjsClient).toHaveBeenCalledWith(apiMock)

    const apiSpy = vi.spyOn(apiMock, 'init')
    expect(apiSpy).not.toHaveBeenCalled()

    expect(result).toBe('transferResult')
  })

  it('should handle exceptions and still disconnect if api is a PjsClient', async () => {
    apiMock.init = vi.fn().mockRejectedValue(new Error('Initialization Error'))

    const options = {
      api: apiMock,
      origin: 'Acala',
      currency: { symbol: 'TEST' },
      amount: 100,
      address: 'some-address',
      destination: 'Astar'
    } as TSendOptions<TPjsApi, Extrinsic>

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
      currency: {},
      amount: 100,
      address: 'some-address',
      destination: 'Astar'
    } as TSendOptions<TPjsApi, Extrinsic>

    await expect(send(options)).rejects.toThrow('Invalid currency')

    const apiSpy = vi.spyOn(apiMock, 'init')
    expect(apiSpy).not.toHaveBeenCalled()
  })

  it('should handle overridedCurrencyMultiLocation when multilocation is present and isOverrideMultiLocationSpecifier returns true', async () => {
    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(true)

    const currency = { multilocation: { type: 'Override', value: {} } }

    const options = {
      api: apiMock,
      origin: 'Acala',
      currency: currency as {
        multilocation: TMultiLocationValueWithOverride
      },
      amount: 100,
      address: 'some-address',
      destination: 'Astar'
    } as TSendOptions<TPjsApi, Extrinsic>

    const transferSpy = vi.spyOn(originNodeMock, 'transfer')

    const result = await send(options)

    expect(isOverrideMultiLocationSpecifier).toHaveBeenCalledWith(currency.multilocation)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        overridedCurrencyMultiLocation: {}
      })
    )

    expect(result).toBe('transferResult')
  })

  it('should handle overridedCurrencyMultiLocation when multiasset is present', async () => {
    const options = {
      api: apiMock,
      origin: 'Acala',
      currency: { multiasset: [] } as TCurrencyInput,
      amount: 100,
      address: 'some-address',
      destination: 'Astar'
    } as TSendOptions<TPjsApi, Extrinsic>

    const transferSpy = vi.spyOn(originNodeMock, 'transfer')

    const result = await send(options)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        overridedCurrencyMultiLocation: []
      })
    )

    expect(result).toBe('transferResult')
  })

  it('should use amount as empty string if amount is undefined', async () => {
    const options = {
      api: apiMock,
      origin: 'Acala',
      currency: { symbol: 'TEST' },
      amount: null,
      address: 'some-address',
      destination: 'Astar'
    } as TSendOptions<TPjsApi, Extrinsic>

    const transferSpy = vi.spyOn(originNodeMock, 'transfer')

    const result = await send(options)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: ''
      })
    )

    expect(result).toBe('transferResult')
  })

  it('should not include optional parameters if they are undefined', async () => {
    const options = {
      api: apiMock,
      origin: 'Acala',
      currency: { symbol: 'TEST' },
      amount: 100,
      address: 'some-address',
      destination: 'Astar',
      paraIdTo: undefined,
      feeAsset: undefined,
      version: undefined,
      destApiForKeepAlive: undefined,
      ahAddress: undefined
    } as unknown as TSendOptions<TPjsApi, Extrinsic>

    const transferSpy = vi.spyOn(originNodeMock, 'transfer')

    const result = await send(options)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        paraIdTo: undefined,
        feeAsset: undefined,
        version: undefined,
        destApiForKeepAlive: undefined,
        ahAddress: undefined
      })
    )

    expect(result).toBe('transferResult')
  })
})
