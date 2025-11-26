import {
  normalizeLocation,
  type TAssetInfo,
  type TAssetWithFee,
  type TCurrencyInput
} from '@paraspell/assets'
import {
  isRelayChain,
  isSubstrateBridge,
  isTLocation,
  Parents,
  type TLocation,
  Version
} from '@paraspell/sdk-common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api'
import type AssetHubPolkadot from '../chains/supported/AssetHubPolkadot'
import { TX_CLIENT_TIMEOUT_MS } from '../constants'
import type { TSendOptions } from '../types'
import { abstractDecimals, getChain, validateAddress } from '../utils'
import { getChainVersion } from '../utils/chain'
import { send } from './transfer'
import { transferRelayToPara } from './transferRelayToPara'
import {
  resolveAsset,
  resolveFeeAsset,
  resolveOverriddenAsset,
  selectXcmVersion,
  shouldPerformAssetCheck,
  validateAssetSpecifiers,
  validateAssetSupport,
  validateCurrency,
  validateDestination,
  validateDestinationAddress
} from './utils'

vi.mock('@paraspell/sdk-common', async importActual => {
  const actual = await importActual<typeof import('@paraspell/sdk-common')>()
  return {
    ...actual,
    isRelayChain: vi.fn(),
    isTLocation: vi.fn(),
    isSubstrateBridge: vi.fn()
  }
})

vi.mock('../utils')
vi.mock('../utils/chain')
vi.mock('@paraspell/assets')
vi.mock('./transferRelayToPara')
vi.mock('./utils')

describe('send', () => {
  let apiMock: IPolkadotApi<unknown, unknown>
  let originChainMock: AssetHubPolkadot<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()

    apiMock = {
      init: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      getApi: vi.fn(),
      deserializeExtrinsics: vi.fn(),
      getApiOrUrl: vi.fn(),
      getConfig: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    originChainMock = {
      transfer: vi.fn().mockResolvedValue('transferResult'),
      version: Version.V4
    } as unknown as AssetHubPolkadot<unknown, unknown>

    vi.mocked(getChain).mockReturnValue(originChainMock)
    vi.mocked(getChainVersion).mockReturnValue(Version.V4)
    vi.mocked(isSubstrateBridge).mockReturnValue(false)
    vi.mocked(shouldPerformAssetCheck).mockReturnValue(true)
    vi.mocked(resolveAsset).mockReturnValue({ symbol: 'TEST' } as TAssetInfo)
    vi.mocked(resolveFeeAsset).mockReturnValue({ symbol: 'FEE' } as TAssetInfo)
    vi.mocked(selectXcmVersion).mockReturnValue(Version.V4)
    vi.mocked(normalizeLocation).mockImplementation(location => location)
    vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should perform the send operation successfully', async () => {
    const options = {
      api: apiMock,
      from: 'Acala',
      currency: { symbol: 'TEST', amount: '100' },
      address: 'some-address',
      to: 'Astar'
    } as TSendOptions<unknown, unknown>
    const transferSpy = vi.spyOn(originChainMock, 'transfer')
    const apiSpy = vi.spyOn(apiMock, 'init')

    const result = await send(options)

    expect(validateCurrency).toHaveBeenCalledWith(options.currency, options.feeAsset)
    expect(validateDestination).toHaveBeenCalledWith(options.from, options.to)
    expect(validateDestinationAddress).toHaveBeenCalledWith(options.address, options.to, apiMock)
    expect(validateAssetSpecifiers).toHaveBeenCalledWith(true, options.currency)
    expect(validateAssetSupport).toHaveBeenCalledWith(options, true, false, { symbol: 'TEST' })

    expect(apiSpy).toHaveBeenCalledWith(options.from, TX_CLIENT_TIMEOUT_MS)

    expect(transferSpy).toHaveBeenCalledWith({
      api: apiMock,
      assetInfo: { symbol: 'TEST', amount: 100n },
      currency: options.currency,
      feeAsset: undefined,
      feeCurrency: undefined,
      address: options.address,
      to: options.to,
      paraIdTo: options.paraIdTo,
      overriddenAsset: undefined,
      version: Version.V4,
      senderAddress: undefined,
      ahAddress: undefined,
      pallet: undefined,
      method: undefined
    })

    expect(result).toBe('transferResult')
  })

  it('should handle when feeAsset is provided', async () => {
    const options = {
      api: apiMock,
      from: 'Acala',
      to: 'Astar',
      currency: { symbol: 'DOT', amount: '100' },
      feeAsset: { symbol: 'USDT' },
      address: 'some-address'
    } as TSendOptions<unknown, unknown>

    const transferSpy = vi.spyOn(originChainMock, 'transfer')

    const result = await send(options)

    expect(resolveFeeAsset).toHaveBeenCalledWith({ symbol: 'USDT' }, 'Acala', 'Astar', {
      symbol: 'DOT',
      amount: '100'
    })

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        feeAsset: { symbol: 'FEE' },
        feeCurrency: { symbol: 'USDT' }
      })
    )

    expect(result).toBe('transferResult')
  })

  it('should handle exceptions', async () => {
    apiMock.init = vi.fn().mockRejectedValue(new Error('Initialization Error'))

    const options = {
      api: apiMock,
      from: 'Acala',
      currency: { symbol: 'TEST', amount: 100 },
      address: 'some-address',
      to: 'Astar'
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
      from: 'Acala',
      currency: {
        amount: 100
      },
      address: 'some-address',
      to: 'Astar'
    } as TSendOptions<unknown, unknown>

    await expect(send(options)).rejects.toThrow('Invalid currency')

    const apiSpy = vi.spyOn(apiMock, 'init')
    expect(apiSpy).not.toHaveBeenCalled()
  })

  it('should handle overriddenAsset when override location is present', async () => {
    vi.mocked(resolveOverriddenAsset).mockReturnValue({} as TLocation)
    const currency = { location: { type: 'Override', value: {} }, amount: '100' }

    const options = {
      api: apiMock,
      from: 'Acala',
      currency: currency,
      address: 'some-address',
      to: 'Astar'
    } as TSendOptions<unknown, unknown>

    const transferSpy = vi.spyOn(originChainMock, 'transfer')

    const result = await send(options)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        overriddenAsset: {}
      })
    )

    expect(result).toBe('transferResult')
  })

  it('should handle overriddenAsset when multiasset is present', async () => {
    vi.mocked(resolveOverriddenAsset).mockReturnValue([] as TAssetWithFee[])

    const options = {
      api: apiMock,
      from: 'Acala',
      currency: [] as TCurrencyInput,
      feeAsset: { location: {} },
      address: 'some-address',
      to: 'Astar'
    } as TSendOptions<unknown, unknown>

    const transferSpy = vi.spyOn(originChainMock, 'transfer')

    const result = await send(options)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        overriddenAsset: []
      })
    )

    expect(result).toBe('transferResult')
  })

  it('should validate senderAddress if provided', async () => {
    const options = {
      api: apiMock,
      from: 'Acala',
      currency: { symbol: 'TEST', amount: 100 },
      address: 'some-address',
      to: 'Astar',
      senderAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
    } as TSendOptions<unknown, unknown>

    await send(options)

    expect(validateAddress).toHaveBeenCalledWith(
      apiMock,
      '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      'Acala',
      false
    )
  })

  it('should not include optional parameters if they are undefined', async () => {
    const options = {
      api: apiMock,
      from: 'Acala',
      currency: { symbol: 'TEST', amount: 100 },
      address: 'some-address',
      to: 'Astar',
      paraIdTo: undefined,
      version: undefined,
      senderAddress: undefined
    } as TSendOptions<unknown, unknown>

    const transferSpy = vi.spyOn(originChainMock, 'transfer')

    const result = await send(options)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        paraIdTo: undefined,
        version: Version.V4,
        senderAddress: undefined
      })
    )

    expect(result).toBe('transferResult')
  })

  it('should throw when destination is ethereum and origin is relay chain', async () => {
    vi.mocked(isRelayChain).mockReturnValue(true)
    vi.mocked(isSubstrateBridge).mockReturnValue(false)

    const options = {
      api: apiMock,
      from: 'Polkadot',
      currency: { symbol: 'DOT', amount: 100 },
      address: 'some-address',
      to: 'Ethereum'
    } as TSendOptions<unknown, unknown>

    await expect(send(options)).rejects.toThrow(
      'Transfers from relay chain to Ethereum are not supported.'
    )
  })

  it('should throw when asset is not provided for relay chain to relay chain transfers', async () => {
    vi.mocked(isRelayChain).mockReturnValue(true)
    vi.mocked(isSubstrateBridge).mockReturnValue(false)
    vi.mocked(resolveAsset).mockReturnValue(null)

    const options = {
      api: apiMock,
      from: 'Polkadot',
      address: 'some-address',
      to: 'Acala',
      currency: { symbol: 'DOT', amount: 100 }
    } as TSendOptions<unknown, unknown>

    await expect(send(options)).rejects.toThrow(
      'Asset is required for relay chain to relay chain transfers.'
    )
  })

  it('should handle relay to para transfers', async () => {
    vi.mocked(isRelayChain).mockReturnValue(true)
    vi.mocked(transferRelayToPara).mockResolvedValue('relayTransferResult')

    const options = {
      api: apiMock,
      from: 'Polkadot',
      to: 'Acala',
      currency: { symbol: 'DOT', amount: '100' },
      address: 'some-address',
      paraIdTo: 1000,
      version: Version.V3,
      pallet: 'XTokens',
      method: 'transfer'
    } as TSendOptions<unknown, unknown>

    const result = await send(options)

    expect(transferRelayToPara).toHaveBeenCalledWith({
      api: apiMock,
      origin: 'Polkadot',
      destination: 'Acala',
      address: 'some-address',
      assetInfo: {
        symbol: 'TEST',
        amount: 100n
      },
      currency: { symbol: 'DOT', amount: '100' },
      paraIdTo: 1000,
      version: Version.V4,
      pallet: 'XTokens',
      method: 'transfer'
    })

    expect(result).toBe('relayTransferResult')
  })

  describe('local transfers on relay chain', () => {
    const relayChain = 'Polkadot'

    beforeEach(() => {
      vi.mocked(isRelayChain).mockReturnValue(true)
      vi.mocked(resolveAsset).mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    })

    it('should perform a local transfer from relay chain successfully', async () => {
      const options = {
        api: apiMock,
        from: relayChain,
        to: relayChain,
        currency: { symbol: 'DOT', amount: '100' },
        address: 'some-polkadot-address'
      } as TSendOptions<unknown, unknown>

      const initSpy = vi.spyOn(apiMock, 'init')
      const callTxSpy = vi
        .spyOn(apiMock, 'deserializeExtrinsics')
        .mockResolvedValue('localTransferResult')

      const result = await send(options)

      expect(initSpy).toHaveBeenCalledWith(relayChain, TX_CLIENT_TIMEOUT_MS)

      expect(callTxSpy).toHaveBeenCalledWith({
        module: 'Balances',
        method: 'transfer_keep_alive',
        params: {
          dest: { Id: options.address },
          value: 100n
        }
      })

      expect(result).toBe('localTransferResult')
    })

    it('should throw an error when location address is provided for local transfer', async () => {
      vi.mocked(isTLocation).mockReturnValue(true)

      const options = {
        api: apiMock,
        from: relayChain,
        to: relayChain,
        currency: { symbol: 'DOT', amount: '100' },
        address: { X1: { AccountId32: { id: '0x1234' } } } as unknown as string
      } as TSendOptions<unknown, unknown>

      await expect(send(options)).rejects.toThrow(
        'Location address is not supported for local transfers.'
      )
    })
  })

  it('should downgrade from V4 to V3 when destination only supports V3', async () => {
    // Mock origin chain to support V4
    vi.mocked(getChainVersion).mockImplementation(chain => {
      if (chain === 'Acala') return Version.V4
      if (chain === 'Astar') return Version.V3
      return Version.V4
    })

    vi.mocked(selectXcmVersion).mockReturnValue(Version.V3)

    const options = {
      api: apiMock,
      from: 'Acala',
      currency: { symbol: 'TEST', amount: '50' },
      address: 'dest-address',
      to: 'Astar'
    } as TSendOptions<unknown, unknown>

    const transferSpy = vi.spyOn(originChainMock, 'transfer')

    const result = await send(options)

    expect(getChainVersion).toHaveBeenCalledWith('Acala')
    expect(getChainVersion).toHaveBeenCalledWith('Astar')
    expect(selectXcmVersion).toHaveBeenCalledWith(undefined, Version.V4, Version.V3)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        version: Version.V3
      })
    )

    expect(result).toBe('transferResult')
  })

  it('resolves correct versions for Polkadot → Manta', async () => {
    vi.mocked(isRelayChain).mockReturnValue(true)
    vi.mocked(transferRelayToPara).mockResolvedValue('relayTransferResult')

    vi.mocked(getChainVersion).mockImplementation(chain => {
      if (chain === 'Polkadot') return Version.V4
      if (chain === 'Manta') return Version.V3
      return Version.V4
    })

    await send({
      api: apiMock,
      from: 'Polkadot',
      to: 'Manta',
      currency: { symbol: 'DOT', amount: 100 },
      address: 'some-address',
      isAmountAll: true
    })

    expect(getChainVersion).toHaveBeenCalledWith('Polkadot')
    expect(getChainVersion).toHaveBeenCalledWith('Manta')
    expect(selectXcmVersion).toHaveBeenCalledWith(undefined, Version.V4, Version.V3)
  })

  it('should handle multiasset currency with default asset object', async () => {
    const options = {
      api: apiMock,
      from: 'Acala',
      to: 'Astar',
      currency: [] as TCurrencyInput,
      address: 'some-address'
    } as TSendOptions<unknown, unknown>

    const transferSpy = vi.spyOn(originChainMock, 'transfer')

    await send(options)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        assetInfo: {
          symbol: 'TEST',
          amount: 0n,
          assetId: '1',
          location: {
            parents: Parents.ZERO,
            interior: {
              Here: null
            }
          }
        }
      })
    )
  })

  it('should ensure minimum amount of 2 for regular currencies', async () => {
    const options = {
      api: apiMock,
      from: 'Acala',
      to: 'Astar',
      currency: { symbol: 'DOT', amount: '1' },
      address: 'some-address'
    } as TSendOptions<unknown, unknown>

    const transferSpy = vi.spyOn(originChainMock, 'transfer')

    await send(options)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        assetInfo: { symbol: 'TEST', amount: 2n }
      })
    )
  })

  it('should normalize location when present', async () => {
    const location = { parents: 1, interior: { X1: { Parachain: 1000 } } }
    vi.mocked(resolveAsset).mockReturnValue({
      symbol: 'TEST',
      location
    } as TAssetInfo)

    const options = {
      api: apiMock,
      from: 'Acala',
      to: 'Astar',
      currency: { symbol: 'TEST', amount: '100' },
      address: 'some-address'
    } as TSendOptions<unknown, unknown>

    const transferSpy = vi.spyOn(originChainMock, 'transfer')

    await send(options)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        assetInfo: expect.objectContaining({
          location
        })
      })
    )
  })
})
