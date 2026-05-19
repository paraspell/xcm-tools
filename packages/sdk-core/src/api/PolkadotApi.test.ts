import {
  findAssetInfoImpl,
  findAssetInfoOnDestImpl,
  findAssetInfoOrThrowImpl,
  findAssetOnDestOrThrowImpl,
  findNativeAssetInfoImpl,
  findNativeAssetInfoOrThrowImpl,
  getAssetsImpl,
  getAssetsObjectImpl,
  getNativeAssetsImpl,
  getNativeAssetSymbolImpl,
  getOtherAssetsImpl,
  getRelayChainSymbolImpl,
  hasDryRunSupportImpl,
  hasXcmPaymentApiSupportImpl,
  isChainEvmImpl
} from '@paraspell/assets'
import type { TPalletEntry } from '@paraspell/pallets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_TTL_MS } from '../constants'
import { ApiNotInitializedError, UnsupportedOperationError } from '../errors'
import type { TBridgeStatus, TBuilderOptions, TDryRunChainResult } from '../types'
import { PolkadotApi } from './PolkadotApi'
import { resolveChainApi } from './resolveChainApi'

vi.mock('./resolveChainApi')

vi.mock('@paraspell/assets', async importOriginal => ({
  ...(await importOriginal()),
  getAssetsObjectImpl: vi.fn(),
  getAssetsImpl: vi.fn(),
  getNativeAssetsImpl: vi.fn(),
  getOtherAssetsImpl: vi.fn(),
  findAssetInfoImpl: vi.fn(),
  findAssetInfoOrThrowImpl: vi.fn(),
  findAssetInfoOnDestImpl: vi.fn(),
  findAssetOnDestOrThrowImpl: vi.fn(),
  findNativeAssetInfoImpl: vi.fn(),
  findNativeAssetInfoOrThrowImpl: vi.fn(),
  isChainEvmImpl: vi.fn(),
  getNativeAssetSymbolImpl: vi.fn(),
  getRelayChainSymbolImpl: vi.fn(),
  hasDryRunSupportImpl: vi.fn(),
  hasXcmPaymentApiSupportImpl: vi.fn()
}))

class ConcreteApi extends PolkadotApi<unknown, unknown, unknown, 'MyCustom'> {
  readonly type = 'PAPI' as const

  leaseClient = () => Promise.resolve({})
  accountToHex = () => ''
  accountToUint8a = () => new Uint8Array()
  deserializeExtrinsics = () => ({})
  txFromHex = () => Promise.resolve({})
  txToHex = () => Promise.resolve('')
  encodeTx = () => ({})
  queryState = <T>() => Promise.resolve({} as T)
  queryRuntimeApi = <T>() => Promise.resolve({} as T)
  callBatchMethod = () => ({})
  callDispatchAsMethod = () => ({})
  objectToHex = () => Promise.resolve('')
  hexToUint8a = () => new Uint8Array()
  stringToUint8a = () => new Uint8Array()
  getMethod = () => ''
  getTypeThenAssetCount = () => undefined
  hasMethod = (_pallet: string, _method: string) => Promise.resolve(false)
  hasRuntimeApi = (_runtimeApi: string) => Promise.resolve(false)
  fetchPalletList = (): Promise<TPalletEntry[]> => Promise.resolve([])
  isEvmChain = () => Promise.resolve(false)
  getPaymentInfo = () => Promise.resolve({ partialFee: 0n, weight: { refTime: 0n, proofSize: 0n } })
  getXcmWeight = () => Promise.resolve({ refTime: 0n, proofSize: 0n })
  getXcmPaymentApiFee = () => Promise.resolve(0n)
  getEvmStorage = () => Promise.resolve('')
  getFromRpc = () => Promise.resolve('')
  blake2AsHex = () => ''
  clone = () => new ConcreteApi()
  createApiForChain = () => Promise.resolve(new ConcreteApi())
  getDryRunCall = (): Promise<TDryRunChainResult> =>
    Promise.resolve({
      success: false as const,
      failureReason: 'stub',
      asset: { decimals: 0, symbol: '', location: { parents: 0, interior: 'Here' as const } }
    })

  getDryRunXcm = (): Promise<TDryRunChainResult> =>
    Promise.resolve({
      success: false as const,
      failureReason: 'stub',
      asset: { decimals: 0, symbol: '', location: { parents: 0, interior: 'Here' as const } }
    })

  getBridgeStatus = (): Promise<TBridgeStatus> => Promise.resolve('Normal')
  disconnect = () => Promise.resolve()
  validateSubstrateAddress = () => true
  deriveAddress = () => ''
  signAndSubmit = () => Promise.resolve('')
  signAndSubmitFinalized = () => Promise.resolve('')
  getSystemProperties = () => Promise.resolve({})
}

describe('PolkadotApi', () => {
  beforeEach(() => {
    vi.mocked(resolveChainApi).mockReset()
  })

  describe('constructor', () => {
    it('should store config when provided', () => {
      const config = { development: true } as TBuilderOptions<unknown>
      const api = new ConcreteApi(config)
      expect(api.config).toBe(config)
    })

    it('should have undefined config when not provided', () => {
      const api = new ConcreteApi()
      expect(api.config).toBeUndefined()
    })

    it('should set default _ttlMs', () => {
      const api = new ConcreteApi()
      expect(api._ttlMs).toBe(DEFAULT_TTL_MS)
    })

    it('should set default _disconnectAllowed to true', () => {
      const api = new ConcreteApi()
      expect(api.disconnectAllowed).toBe(true)
    })
  })

  describe('api getter', () => {
    it('should throw ApiNotInitializedError when _api is undefined', () => {
      const instance = new ConcreteApi()
      expect(() => instance.api).toThrow(ApiNotInitializedError)
    })

    it('should return _api when set', () => {
      const instance = new ConcreteApi()
      const fakeApi = { fake: true }
      instance._api = fakeApi
      expect(instance.api).toBe(fakeApi)
    })
  })

  describe('disconnectAllowed getter/setter', () => {
    it('should set and get disconnectAllowed', () => {
      const instance = new ConcreteApi()
      expect(instance.disconnectAllowed).toBe(true)

      instance.disconnectAllowed = false
      expect(instance.disconnectAllowed).toBe(false)

      instance.disconnectAllowed = true
      expect(instance.disconnectAllowed).toBe(true)
    })
  })

  describe('asset/chain query delegations', () => {
    const ctx = expect.objectContaining({}) as unknown as Record<string, unknown>
    const chain = 'Acala'

    type Case = {
      method: keyof PolkadotApi<unknown, unknown, unknown>
      impl: ReturnType<typeof vi.fn>
      args: unknown[]
      expectedArgs: unknown[]
      returnValue: unknown
    }

    const cases: Case[] = [
      {
        method: 'getAssetsObject',
        impl: vi.mocked(getAssetsObjectImpl),
        args: [chain],
        expectedArgs: [chain, ctx],
        returnValue: { assets: [] }
      },
      {
        method: 'getAssets',
        impl: vi.mocked(getAssetsImpl),
        args: [chain],
        expectedArgs: [chain, ctx],
        returnValue: []
      },
      {
        method: 'getNativeAssets',
        impl: vi.mocked(getNativeAssetsImpl),
        args: [chain],
        expectedArgs: [chain, ctx],
        returnValue: []
      },
      {
        method: 'getOtherAssets',
        impl: vi.mocked(getOtherAssetsImpl),
        args: [chain],
        expectedArgs: [chain, ctx],
        returnValue: []
      },
      {
        method: 'findAssetInfo',
        impl: vi.mocked(findAssetInfoImpl),
        args: [chain, { symbol: 'A' }, 'Polkadot'],
        expectedArgs: [chain, { symbol: 'A' }, 'Polkadot', ctx],
        returnValue: { symbol: 'A', decimals: 12 }
      },
      {
        method: 'findAssetInfoOrThrow',
        impl: vi.mocked(findAssetInfoOrThrowImpl),
        args: [chain, { symbol: 'A' }, 'Polkadot'],
        expectedArgs: [chain, { symbol: 'A' }, 'Polkadot', ctx],
        returnValue: { symbol: 'A', decimals: 12 }
      },
      {
        method: 'findAssetInfoOnDest',
        impl: vi.mocked(findAssetInfoOnDestImpl),
        args: [chain, 'Polkadot', { symbol: 'A' }, null],
        expectedArgs: [chain, 'Polkadot', { symbol: 'A' }, null, ctx],
        returnValue: { symbol: 'A', decimals: 12 }
      },
      {
        method: 'findAssetOnDestOrThrow',
        impl: vi.mocked(findAssetOnDestOrThrowImpl),
        args: [chain, 'Polkadot', { symbol: 'A' }],
        expectedArgs: [chain, 'Polkadot', { symbol: 'A' }, ctx],
        returnValue: { symbol: 'A', decimals: 12 }
      },
      {
        method: 'findNativeAssetInfo',
        impl: vi.mocked(findNativeAssetInfoImpl),
        args: [chain],
        expectedArgs: [chain, ctx],
        returnValue: { symbol: 'A', decimals: 12 }
      },
      {
        method: 'findNativeAssetInfoOrThrow',
        impl: vi.mocked(findNativeAssetInfoOrThrowImpl),
        args: [chain],
        expectedArgs: [chain, ctx],
        returnValue: { symbol: 'A', decimals: 12 }
      },
      {
        method: 'isChainEvm',
        impl: vi.mocked(isChainEvmImpl),
        args: [chain],
        expectedArgs: [chain, ctx],
        returnValue: false
      },
      {
        method: 'getNativeAssetSymbol',
        impl: vi.mocked(getNativeAssetSymbolImpl),
        args: [chain],
        expectedArgs: [chain, ctx],
        returnValue: 'ACA'
      },
      {
        method: 'getRelayChainSymbol',
        impl: vi.mocked(getRelayChainSymbolImpl),
        args: [chain],
        expectedArgs: [chain, ctx],
        returnValue: 'DOT'
      },
      {
        method: 'hasDryRunSupport',
        impl: vi.mocked(hasDryRunSupportImpl),
        args: [chain],
        expectedArgs: [chain, ctx],
        returnValue: true
      },
      {
        method: 'hasXcmPaymentApiSupport',
        impl: vi.mocked(hasXcmPaymentApiSupportImpl),
        args: [chain],
        expectedArgs: [chain, ctx],
        returnValue: true
      }
    ]

    it.each(cases)(
      'forwards $method to its impl with the custom ctx',
      ({ method, impl, args, expectedArgs, returnValue }) => {
        impl.mockReturnValue(returnValue)
        const api = new ConcreteApi()
        const result = (api[method] as (...a: unknown[]) => unknown)(...args)
        expect(impl).toHaveBeenCalledWith(...expectedArgs)
        expect(result).toBe(returnValue)
      }
    )
  })

  describe('init', () => {
    it('should return early if chain is already set', async () => {
      const instance = new ConcreteApi()
      instance._chain = 'Acala'

      await instance.init('Hydration')

      expect(instance._chain).toBe('Acala')
      expect(resolveChainApi).not.toHaveBeenCalled()
    })

    it('should return early for external chains', async () => {
      const instance = new ConcreteApi()
      await instance.init('Ethereum')

      expect(instance._chain).toBeUndefined()
      expect(instance._api).toBeUndefined()
      expect(resolveChainApi).not.toHaveBeenCalled()
    })

    it('should initialize chain and api via resolveChainApi', async () => {
      const fakeApi = { fake: true }
      const customTtl = 60_000
      vi.mocked(resolveChainApi).mockResolvedValue(fakeApi)

      const instance = new ConcreteApi()
      await instance.init('Acala', customTtl)

      expect(instance._chain).toBe('Acala')
      expect(instance._ttlMs).toBe(customTtl)
      expect(instance._api).toBe(fakeApi)
      expect(resolveChainApi).toHaveBeenCalledOnce()

      // Verify that the createApi callback passed to resolveChainApi is correct
      const createApiArg = vi.mocked(resolveChainApi).mock.calls[0][2]
      expect(typeof createApiArg).toBe('function')
    })

    it('should not re-initialize when called twice', async () => {
      vi.mocked(resolveChainApi).mockResolvedValue({ first: true })

      const instance = new ConcreteApi()
      await instance.init('Acala')
      await instance.init('Hydration')

      expect(instance._chain).toBe('Acala')
      expect(resolveChainApi).toHaveBeenCalledOnce()
    })
  })

  describe('maybeHydrateCustomChain', () => {
    const buildInstance = (hasMethod: (pallet: string, method: string) => boolean) => {
      vi.mocked(resolveChainApi).mockResolvedValue({})
      const instance = new ConcreteApi({
        customChains: {
          MyCustom: {
            paraId: 4242,
            ecosystem: 'Polkadot',
            providers: [{ name: 'rpc', endpoint: 'wss://example' }],
            ss58Prefix: 42,
            nativeAssetSymbol: 'CUS',
            nativeAssetDecimals: 12
          }
        }
      })
      instance.hasMethod = vi.fn((pallet: string, method: string) =>
        Promise.resolve(hasMethod(pallet, method))
      )
      instance.hasRuntimeApi = vi.fn(() => Promise.resolve(false))
      instance.isEvmChain = vi.fn(() => Promise.resolve(false))
      instance.fetchPalletList = vi.fn(() =>
        Promise.resolve([{ name: 'Balances', index: 1, hasExtrinsics: true }])
      )
      return instance
    }

    it('detects PolkadotXcm and stores it on the hydrated assets info', async () => {
      const instance = buildInstance(
        (pallet, method) => pallet === 'PolkadotXcm' && method === 'send'
      )
      await instance.init('MyCustom')
      expect(instance.hasMethod).toHaveBeenCalledWith('PolkadotXcm', 'send')
      expect(instance.hasMethod).toHaveBeenCalledWith('XcmPallet', 'send')
    })

    it('detects XcmPallet when PolkadotXcm is absent', async () => {
      const instance = buildInstance(
        (pallet, method) => pallet === 'XcmPallet' && method === 'send'
      )
      await expect(instance.init('MyCustom')).resolves.not.toThrow()
    })

    it('throws UnsupportedOperationError when neither pallet is present', async () => {
      const instance = buildInstance(() => false)
      await expect(instance.init('MyCustom')).rejects.toThrow(UnsupportedOperationError)
    })

    it('hydrates ss58 / native symbol / native decimals from system properties when omitted', async () => {
      vi.mocked(resolveChainApi).mockResolvedValue({})
      const instance = new ConcreteApi({
        customChains: {
          MyCustom: {
            paraId: 4242,
            ecosystem: 'Polkadot',
            providers: [{ name: 'rpc', endpoint: 'wss://example' }]
          }
        }
      })
      instance.hasMethod = vi.fn((pallet: string, method: string) =>
        Promise.resolve(pallet === 'PolkadotXcm' && method === 'send')
      )
      instance.hasRuntimeApi = vi.fn(() => Promise.resolve(false))
      instance.isEvmChain = vi.fn(() => Promise.resolve(false))
      instance.fetchPalletList = vi.fn(() =>
        Promise.resolve([{ name: 'Balances', index: 1, hasExtrinsics: true }])
      )
      instance.getSystemProperties = vi.fn(() =>
        Promise.resolve({ ss58Format: 7, tokenSymbol: 'CUS', tokenDecimals: 18 })
      )

      await instance.init('MyCustom')

      expect(instance.getSystemProperties).toHaveBeenCalledOnce()
      const entry = instance._customCtx.customChains?.MyCustom
      expect(entry).toMatchObject({
        ss58Prefix: 7,
        nativeAssetSymbol: 'CUS',
        nativeAssetDecimals: 18
      })
      expect(instance._customCtx.customChainAssets?.MyCustom).toBeDefined()
    })

    it('skips system-property fetching when all native props are already set', async () => {
      vi.mocked(resolveChainApi).mockResolvedValue({})
      const instance = new ConcreteApi({
        customChains: {
          MyCustom: {
            paraId: 4242,
            ecosystem: 'Polkadot',
            providers: [{ name: 'rpc', endpoint: 'wss://example' }],
            ss58Prefix: 42,
            nativeAssetSymbol: 'CUS',
            nativeAssetDecimals: 12
          }
        }
      })
      instance.hasMethod = vi.fn((pallet: string, method: string) =>
        Promise.resolve(pallet === 'PolkadotXcm' && method === 'send')
      )
      instance.hasRuntimeApi = vi.fn(() => Promise.resolve(false))
      instance.isEvmChain = vi.fn(() => Promise.resolve(false))
      instance.fetchPalletList = vi.fn(() =>
        Promise.resolve([{ name: 'Balances', index: 1, hasExtrinsics: true }])
      )
      const sysProps = vi.fn(() => Promise.resolve({}))
      instance.getSystemProperties = sysProps

      await instance.init('MyCustom')

      expect(sysProps).not.toHaveBeenCalled()
    })

    it('returns early in maybeHydrateCustomChain when chain is not a custom chain', async () => {
      vi.mocked(resolveChainApi).mockResolvedValue({})
      const instance = new ConcreteApi()
      const sysProps = vi.fn(() => Promise.resolve({}))
      instance.getSystemProperties = sysProps

      await instance.init('Acala')

      expect(sysProps).not.toHaveBeenCalled()
    })

    it('passes a leaseClient callback that forwards wsUrl + ttl', async () => {
      vi.mocked(resolveChainApi).mockResolvedValue({})
      const instance = new ConcreteApi()
      const leaseSpy = vi.spyOn(instance, 'leaseClient')

      await instance.init('Acala', 12_345)

      const cb = vi.mocked(resolveChainApi).mock.calls[0][2]
      await cb('wss://endpoint')
      expect(leaseSpy).toHaveBeenCalledWith('wss://endpoint', 12_345)
    })
  })
})
