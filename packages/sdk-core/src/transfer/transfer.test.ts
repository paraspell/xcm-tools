import {
  normalizeMultiLocation,
  type TAsset,
  type TCurrencyInput,
  type TMultiAssetWithFee
} from '@paraspell/assets'
import type { TMultiLocation } from '@paraspell/sdk-common'
import { isDotKsmBridge, isRelayChain, isTMultiLocation, Version } from '@paraspell/sdk-common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api'
import { TX_CLIENT_TIMEOUT_MS } from '../constants'
import type AssetHubPolkadot from '../nodes/supported/AssetHubPolkadot'
import type { TSendOptions } from '../types'
import { getNode, validateAddress } from '../utils'
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

vi.mock('@paraspell/sdk-common', async () => {
  const actual =
    await vi.importActual<typeof import('@paraspell/sdk-common')>('@paraspell/sdk-common')
  return {
    ...actual,
    isRelayChain: vi.fn(),
    isTMultiLocation: vi.fn(),
    isDotKsmBridge: vi.fn()
  }
})

vi.mock('../utils', () => ({
  getNode: vi.fn(),
  validateAddress: vi.fn()
}))

vi.mock('../utils/chain', () => ({
  getChainVersion: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  isOverrideMultiLocationSpecifier: vi.fn(),
  normalizeMultiLocation: vi.fn()
}))

vi.mock('./transferRelayToPara', () => ({
  transferRelayToPara: vi.fn()
}))

vi.mock('./utils', () => ({
  validateDestinationAddress: vi.fn(),
  shouldPerformAssetCheck: vi.fn(),
  resolveAsset: vi.fn(),
  resolveFeeAsset: vi.fn(),
  resolveOverriddenAsset: vi.fn(),
  validateCurrency: vi.fn(),
  validateDestination: vi.fn(),
  validateAssetSpecifiers: vi.fn(),
  validateAssetSupport: vi.fn(),
  selectXcmVersion: vi.fn()
}))

describe('send', () => {
  let apiMock: IPolkadotApi<unknown, unknown>
  let originNodeMock: AssetHubPolkadot<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()

    apiMock = {
      init: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      getApi: vi.fn(),
      callTxMethod: vi.fn(),
      getApiOrUrl: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    originNodeMock = {
      transfer: vi.fn().mockResolvedValue('transferResult'),
      version: Version.V4
    } as unknown as AssetHubPolkadot<unknown, unknown>

    vi.mocked(getNode).mockReturnValue(originNodeMock)
    vi.mocked(getChainVersion).mockReturnValue(Version.V4)
    vi.mocked(isDotKsmBridge).mockReturnValue(false)
    vi.mocked(shouldPerformAssetCheck).mockReturnValue(true)
    vi.mocked(resolveAsset).mockReturnValue({ symbol: 'TEST' } as TAsset)
    vi.mocked(resolveFeeAsset).mockReturnValue({ symbol: 'FEE' } as TAsset)
    vi.mocked(selectXcmVersion).mockReturnValue(Version.V4)
    vi.mocked(normalizeMultiLocation).mockImplementation(location => location)
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
    const transferSpy = vi.spyOn(originNodeMock, 'transfer')
    const apiSpy = vi.spyOn(apiMock, 'init')

    const result = await send(options)

    expect(validateCurrency).toHaveBeenCalledWith(options.currency, options.feeAsset)
    expect(validateDestination).toHaveBeenCalledWith(options.from, options.to)
    expect(validateDestinationAddress).toHaveBeenCalledWith(options.address, options.to)
    expect(validateAssetSpecifiers).toHaveBeenCalledWith(true, options.currency)
    expect(validateAssetSupport).toHaveBeenCalledWith(options, true, false, { symbol: 'TEST' })

    expect(apiSpy).toHaveBeenCalledWith(options.from, TX_CLIENT_TIMEOUT_MS)

    expect(transferSpy).toHaveBeenCalledWith({
      api: apiMock,
      asset: { symbol: 'TEST', amount: 100n },
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

    const transferSpy = vi.spyOn(originNodeMock, 'transfer')

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

  it('should handle overriddenAsset when override multi-location is present', async () => {
    vi.mocked(resolveOverriddenAsset).mockReturnValue({} as TMultiLocation)
    const currency = { multilocation: { type: 'Override', value: {} }, amount: '100' }

    const options = {
      api: apiMock,
      from: 'Acala',
      currency: currency,
      address: 'some-address',
      to: 'Astar'
    } as TSendOptions<unknown, unknown>

    const transferSpy = vi.spyOn(originNodeMock, 'transfer')

    const result = await send(options)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        overriddenAsset: {}
      })
    )

    expect(result).toBe('transferResult')
  })

  it('should handle overriddenAsset when multiasset is present', async () => {
    vi.mocked(resolveOverriddenAsset).mockReturnValue([] as TMultiAssetWithFee[])

    const options = {
      api: apiMock,
      from: 'Acala',
      currency: { multiasset: [] } as TCurrencyInput,
      feeAsset: { multilocation: {} },
      address: 'some-address',
      to: 'Astar'
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

    const transferSpy = vi.spyOn(originNodeMock, 'transfer')

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
    vi.mocked(isDotKsmBridge).mockReturnValue(false)

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
    vi.mocked(isDotKsmBridge).mockReturnValue(false)
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
      asset: {
        symbol: 'TEST',
        amount: 100n
      },
      paraIdTo: 1000,
      version: Version.V4,
      pallet: 'XTokens',
      method: 'transfer'
    })

    expect(result).toBe('relayTransferResult')
  })

  describe('local transfers on relay chain', () => {
    const relayChain = 'Kusama'

    beforeEach(() => {
      vi.mocked(isRelayChain).mockReturnValue(true)
      vi.mocked(resolveAsset).mockReturnValue({ symbol: 'DOT' } as TAsset)
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
      const callTxSpy = vi.spyOn(apiMock, 'callTxMethod').mockResolvedValue('localTransferResult')

      const result = await send(options)

      expect(initSpy).toHaveBeenCalledWith(relayChain, TX_CLIENT_TIMEOUT_MS)

      expect(callTxSpy).toHaveBeenCalledWith({
        module: 'Balances',
        method: 'transfer_keep_alive',
        parameters: {
          dest: { Id: options.address },
          value: 100n
        }
      })

      expect(result).toBe('localTransferResult')
    })

    it('should throw an error when Multi-Location address is provided for local transfer', async () => {
      vi.mocked(isTMultiLocation).mockReturnValue(true)

      const options = {
        api: apiMock,
        from: relayChain,
        to: relayChain,
        currency: { symbol: 'DOT', amount: '100' },
        address: { X1: { AccountId32: { id: '0x1234' } } } as unknown as string
      } as TSendOptions<unknown, unknown>

      await expect(send(options)).rejects.toThrow(
        'Multi-Location address is not supported for local transfers.'
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

    const transferSpy = vi.spyOn(originNodeMock, 'transfer')

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
      address: 'some-address'
    })

    expect(getChainVersion).toHaveBeenCalledWith('Polkadot')
    expect(getChainVersion).toHaveBeenCalledWith('Manta')
    expect(selectXcmVersion).toHaveBeenCalledWith(undefined, Version.V4, Version.V3)
  })

  it('should handle multiasset currency with amount 0', async () => {
    const options = {
      api: apiMock,
      from: 'Acala',
      to: 'Astar',
      currency: { multiasset: [], amount: '0' } as TCurrencyInput,
      address: 'some-address'
    } as TSendOptions<unknown, unknown>

    const transferSpy = vi.spyOn(originNodeMock, 'transfer')

    await send(options)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        asset: { symbol: 'TEST', amount: 0n, assetId: '1' }
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

    const transferSpy = vi.spyOn(originNodeMock, 'transfer')

    await send(options)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        asset: { symbol: 'TEST', amount: 2n }
      })
    )
  })

  it('should normalize multiLocation when present', async () => {
    const multiLocation = { parents: 1, interior: { X1: { Parachain: 1000 } } }
    vi.mocked(resolveAsset).mockReturnValue({
      symbol: 'TEST',
      multiLocation
    } as TAsset)

    const options = {
      api: apiMock,
      from: 'Acala',
      to: 'Astar',
      currency: { symbol: 'TEST', amount: '100' },
      address: 'some-address'
    } as TSendOptions<unknown, unknown>

    const transferSpy = vi.spyOn(originNodeMock, 'transfer')

    await send(options)

    expect(transferSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        asset: expect.objectContaining({
          multiLocation
        })
      })
    )
  })
})
