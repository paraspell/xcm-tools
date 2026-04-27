import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_TTL_MS } from '../constants'
import { ApiNotInitializedError } from '../errors'
import type { TBridgeStatus, TBuilderOptions, TDryRunChainResult } from '../types'
import { PolkadotApi } from './PolkadotApi'
import { resolveChainApi } from './resolveChainApi'

vi.mock('./resolveChainApi')

class ConcreteApi extends PolkadotApi<unknown, unknown, unknown> {
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
  hasMethod = () => Promise.resolve(false)
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
})
