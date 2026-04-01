import { describe, expect, it } from 'vitest'

import { DEFAULT_TTL_MS } from '../constants'
import { ApiNotInitializedError } from '../errors'
import type { TBridgeStatus, TBuilderOptions, TDryRunChainResult } from '../types'
import { PolkadotApi } from './PolkadotApi'

class ConcreteApi extends PolkadotApi<unknown, unknown, unknown> {
  readonly type = 'PAPI' as const

  init = () => Promise.resolve()
  createApiInstance = () => Promise.resolve({})
  accountToHex = () => ''
  accountToUint8a = () => new Uint8Array()
  deserializeExtrinsics = () => ({})
  txFromHex = () => Promise.resolve({})
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
  quoteAhPrice = () => Promise.resolve(undefined)
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
})
