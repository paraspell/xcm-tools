import type {
  TAssetInfo,
  TChainAssetsInfo,
  TDestination,
  TDryRunXcmBaseOptions,
  TPallet,
  TSerializedExtrinsics,
  WithAmount
} from '@paraspell/sdk-core'
import {
  addXcmVersionHeader,
  BatchMode,
  findAssetInfoOrThrow,
  findNativeAssetInfoOrThrow,
  getAssetsObject,
  getChainProviders,
  hasXcmPaymentApiSupport,
  InvalidAddressError,
  isAssetEqual,
  isAssetXcEqual,
  isSystemChain,
  localizeLocation,
  Parents,
  RELAY_LOCATION,
  SubmitTransactionError,
  type TLocation,
  type TSubstrateChain,
  Version,
  wrapTxBypass
} from '@paraspell/sdk-core'
import type { Codec, PolkadotClient, SS58String } from 'polkadot-api'
import { AccountId, Binary, createClient, getSs58AddressInfo } from 'polkadot-api'
import { toHex } from 'polkadot-api/utils'
import { createWsClient } from 'polkadot-api/ws'
import type { Mock } from 'vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import PapiApi from './PapiApi'
import { transform } from './PapiXcmTransformer'
import type { TPapiTransaction } from './types'
import { computeOriginFee, deriveAddress } from './utils'

vi.mock('polkadot-api')
vi.mock('polkadot-api/utils')
vi.mock('polkadot-api/ws')

vi.mock('./PapiXcmTransformer', () => ({
  transform: vi.fn().mockReturnValue({ transformed: true })
}))

vi.mock('./utils', async importActual => ({
  ...(await importActual()),
  computeOriginFee: vi.fn(),
  deriveAddress: vi.fn(),
  createDevSigner: vi.fn().mockReturnValue({ publicKey: new Uint8Array(32) })
}))

vi.mock('@paraspell/sdk-core', async importOriginal => ({
  ...(await importOriginal()),
  addXcmVersionHeader: vi.fn(),
  createChainClient: vi.fn().mockResolvedValue({}),
  getAssetsObject: vi.fn(),
  hasXcmPaymentApiSupport: vi.fn(),
  isAssetEqual: vi.fn(),
  getChainProviders: vi.fn(),
  wrapTxBypass: vi.fn(),
  findAssetInfoOrThrow: vi.fn(),
  findNativeAssetInfoOrThrow: vi.fn(),
  isSystemChain: vi.fn(),
  localizeLocation: vi.fn(),
  isAssetXcEqual: vi.fn()
}))

describe('PapiApi', () => {
  let papiApi: PapiApi
  let mockPolkadotClient: PolkadotClient
  let mockTransaction: TPapiTransaction
  let mockDryRunResult
  let accountCurrencyMapGetValue: Mock
  const mockChain = 'Acala'

  beforeEach(async () => {
    vi.clearAllMocks()

    mockTransaction = {
      getPaymentInfo: vi.fn().mockResolvedValue({
        partial_fee: 1000n,
        weight: {
          ref_time: 0n,
          proof_size: 0n
        }
      }),
      getEncodedData: vi.fn().mockResolvedValue(new Uint8Array()),
      decodedCall: {
        value: {
          type: 'transfer_assets'
        }
      }
    } as unknown as TPapiTransaction

    mockDryRunResult = {
      success: true,
      value: {
        execution_result: {
          sucesss: true,
          value: {
            actual_weight: {
              ref_time: 0n,
              proof_size: 0n
            }
          }
        },
        local_xcm: { type: 'V4', value: [] }
      }
    }

    mockPolkadotClient = {
      _request: vi.fn(),
      destroy: vi.fn(),
      getUnsafeApi: vi.fn().mockReturnValue({
        apis: {
          LocationToAccountApi: {
            convert_location: vi.fn()
          },
          DryRunApi: {
            dry_run_call: vi.fn().mockResolvedValue(mockDryRunResult)
          },
          AssetConversionApi: {
            quote_price_exact_tokens_for_tokens: vi.fn().mockResolvedValue(1n)
          },
          XcmPaymentApi: {
            query_xcm_weight: vi
              .fn()
              .mockResolvedValue({ success: true, value: { ref_time: 100n, proof_size: 200n } }),
            query_weight_to_asset_fee: vi.fn().mockResolvedValue({ value: 100n })
          }
        },
        tx: {
          XcmPallet: {
            methodName: vi.fn().mockReturnValue(mockTransaction)
          },
          PolkadotXcm: {
            send: vi.fn().mockReturnValue({
              getEncodedData: vi.fn().mockReturnValue({
                asHex: vi.fn().mockReturnValue('0x1234567890abcdef')
              })
            })
          }
        },
        query: {
          EVM: {
            AccountStorages: {
              getValue: vi.fn()
            }
          },
          MultiTransactionPayment: {
            AccountCurrencyMap: {
              getValue: vi.fn()
            }
          },
          EthereumOutboundQueue: {
            OperatingMode: {
              getValue: vi.fn().mockResolvedValue({ type: 'Normal' })
            }
          },
          System: {
            Account: {
              getValue: vi.fn()
            }
          }
        },
        txFromCallData: vi.fn().mockReturnValue(mockTransaction)
      })
    } as unknown as PolkadotClient
    vi.mocked(createClient).mockReturnValue(mockPolkadotClient)
    vi.mocked(hasXcmPaymentApiSupport).mockReturnValue(false)
    vi.mocked(deriveAddress).mockReturnValue('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')
    papiApi = new PapiApi(mockPolkadotClient)
    await papiApi.init(mockChain)

    accountCurrencyMapGetValue = papiApi.api.getUnsafeApi().query.MultiTransactionPayment
      .AccountCurrencyMap.getValue as unknown as Mock
    accountCurrencyMapGetValue.mockClear()
  })

  describe('resolveUsedAsset', () => {
    const createOptions = () => ({
      tx: mockTransaction,
      address: 'addr',
      chain: 'Hydration' as TSubstrateChain,
      version: Version.V5,
      destination: 'Moonbeam' as TDestination,
      asset: { symbol: 'DOT' } as WithAmount<TAssetInfo>
    })

    it('returns native asset when MultiTransactionPayment has no mapping', async () => {
      const nativeAsset = { symbol: 'HYDR' } as TAssetInfo
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue(nativeAsset)
      accountCurrencyMapGetValue.mockResolvedValueOnce(undefined)

      const result = await papiApi.resolveFeeAsset(createOptions())

      expect(accountCurrencyMapGetValue).toHaveBeenCalledWith('addr')
      expect(findNativeAssetInfoOrThrow).toHaveBeenCalledWith('Hydration')
      expect(result).toEqual({ isCustomAsset: false, asset: nativeAsset })

      vi.mocked(findNativeAssetInfoOrThrow).mockReset()
    })

    it('returns mapped asset when MultiTransactionPayment specifies an id', async () => {
      const mappedAsset = { symbol: 'USDC' } as TAssetInfo
      accountCurrencyMapGetValue.mockResolvedValueOnce('1001')
      vi.mocked(findAssetInfoOrThrow).mockReturnValue(mappedAsset)

      const result = await papiApi.resolveFeeAsset(createOptions())

      expect(accountCurrencyMapGetValue).toHaveBeenCalledWith('addr')
      expect(findAssetInfoOrThrow).toHaveBeenCalledWith('Hydration', { id: '1001' })
      expect(result).toEqual({ isCustomAsset: true, asset: mappedAsset })

      vi.mocked(findAssetInfoOrThrow).mockReset()
    })
  })

  it('should return PAPI api type', () => {
    expect(papiApi.type).toBe('PAPI')
  })

  describe('deserializeExtrinsics', () => {
    it('should create a transaction with the provided module, method, and parameters', () => {
      const serializedCall: TSerializedExtrinsics = {
        module: 'XcmPallet',
        method: 'methodName',
        params: { param1: 'value1', param2: 'value2' }
      }

      const mockTxMethod = vi.fn().mockReturnValue(mockTransaction)
      const unsafeApi = papiApi.api.getUnsafeApi()

      unsafeApi.tx = {
        XcmPallet: {
          methodName: mockTxMethod
        }
      }

      const result = papiApi.deserializeExtrinsics(serializedCall)

      expect(result).toBe(mockTransaction)
      expect(mockTxMethod).toHaveBeenCalledOnce()
    })
  })

  describe('queryState', () => {
    it('should call query with transformed params and return the result', async () => {
      const mockValue = { balance: 1000n }
      const unsafeApi = papiApi.api.getUnsafeApi()
      const mockGetValue = vi.mocked(unsafeApi.query.System.Account.getValue)
      mockGetValue.mockResolvedValue(mockValue)

      const result = await papiApi.queryState({
        module: 'System',
        method: 'Account',
        params: ['some_address']
      })

      expect(result).toBe(mockValue)
      expect(mockGetValue).toHaveBeenCalledOnce()
    })
  })

  describe('queryRuntimeApi', () => {
    it('should call runtime api with transformed params and return the result', async () => {
      const mockResult = { weight: 500n }
      const mockMethod = vi.fn().mockResolvedValue(mockResult)
      const unsafeApi = papiApi.api.getUnsafeApi()
      unsafeApi.apis.AssetManager = { some_method: mockMethod }

      const result = await papiApi.queryRuntimeApi({
        module: 'AssetManager',
        method: 'some_method',
        params: ['param1']
      })

      expect(result).toBe(mockResult)
      expect(mockMethod).toHaveBeenCalledOnce()
    })
  })

  describe('callDispatchAsMethod', () => {
    it('should create a dispatch call with the provided module, method, and parameters', () => {
      const mockAddress = 'some_address'
      const mockDispatchMethod = vi.fn().mockReturnValue(mockTransaction)

      const unsafeApi = papiApi.api.getUnsafeApi()

      unsafeApi.tx.Utility = {
        dispatch_as: mockDispatchMethod
      }

      const result = papiApi.callDispatchAsMethod(mockTransaction, mockAddress)

      expect(result).toBe(mockTransaction)
      expect(mockDispatchMethod).toHaveBeenCalledOnce()
    })
  })

  describe('hasMethod', () => {
    it('returns true when the pallet.method exists (encodes successfully)', async () => {
      const unsafeApi = papiApi.api.getUnsafeApi()
      const getEncodedData = vi.fn().mockResolvedValue('0xdead')

      unsafeApi.tx = {
        PolkadotXcm: {
          transfer_assets: vi.fn().mockReturnValue({ getEncodedData })
        }
      }

      const res = await papiApi.hasMethod('PolkadotXcm', 'transfer_assets')
      expect(res).toBe(true)
      expect(unsafeApi.tx.PolkadotXcm.transfer_assets).toHaveBeenCalledTimes(1)
      expect(getEncodedData).toHaveBeenCalledTimes(1)
    })

    it('returns false when the specific "Runtime entry … not found" error is thrown', async () => {
      const pallet: TPallet = 'PolkadotXcm'
      const method = 'missing_method'
      const unsafeApi = papiApi.api.getUnsafeApi()
      const getEncodedData = vi
        .fn()
        .mockRejectedValue(new Error(`Runtime entry Tx(${pallet}.${method}) not found`))

      unsafeApi.tx = {
        [pallet]: {
          [method]: vi.fn().mockReturnValue({ getEncodedData })
        }
      }

      const res = await papiApi.hasMethod(pallet, method)
      expect(res).toBe(false)
      expect(unsafeApi.tx[pallet][method]).toHaveBeenCalledTimes(1)
      expect(getEncodedData).toHaveBeenCalledTimes(1)
    })

    it('returns true when a different error is thrown', async () => {
      const pallet: TPallet = 'PolkadotXcm'
      const method = 'some'
      const unsafeApi = papiApi.api.getUnsafeApi()
      const getEncodedData = vi.fn().mockRejectedValue(new Error('Unexpected'))

      unsafeApi.tx = {
        [pallet]: {
          [method]: vi.fn().mockReturnValue({ getEncodedData })
        }
      }

      const res = await papiApi.hasMethod(pallet, method)
      expect(res).toBe(true)
      expect(unsafeApi.tx[pallet][method]).toHaveBeenCalledTimes(1)
      expect(getEncodedData).toHaveBeenCalledTimes(1)
    })
  })

  describe('callBatchMethod', () => {
    it('should call the batch method with the provided calls and BATCH mode', () => {
      const calls = [mockTransaction, mockTransaction]
      const mode = BatchMode.BATCH_ALL

      const unsafeApi = papiApi.api.getUnsafeApi()
      unsafeApi.tx.Utility = {
        batch: vi.fn(),
        batch_all: vi.fn()
      }

      papiApi.callBatchMethod(calls, mode)

      expect(unsafeApi.tx.Utility.batch).not.toHaveBeenCalled()
      expect(unsafeApi.tx.Utility.batch_all).toHaveBeenCalledOnce()
    })

    it('should call the batch method with the provided calls and BATCH_ALL mode', () => {
      const calls = [mockTransaction, mockTransaction]
      const mode = BatchMode.BATCH

      const unsafeApi = papiApi.api.getUnsafeApi()
      unsafeApi.tx.Utility = {
        batch: vi.fn(),
        batch_all: vi.fn()
      }

      papiApi.callBatchMethod(calls, mode)

      expect(unsafeApi.tx.Utility.batch).toHaveBeenCalledOnce()
      expect(unsafeApi.tx.Utility.batch_all).not.toHaveBeenCalled()
    })
  })

  describe('getPaymentInfo', () => {
    it('should return the estimated fee and weight', async () => {
      const fee = await papiApi.getPaymentInfo(mockTransaction, 'some_address')
      expect(mockTransaction.getPaymentInfo).toHaveBeenCalledWith('some_address')
      expect(fee).toEqual({
        partialFee: 1000n,
        weight: {
          refTime: 0n,
          proofSize: 0n
        }
      })
    })
  })

  describe('getEvmStorage', () => {
    it('should return the EVM storage as bigint', async () => {
      const unsafeApi = papiApi.api.getUnsafeApi()

      unsafeApi.query.EVM.AccountStorages.getKey = vi.fn().mockResolvedValue(3000n)

      const storage = await papiApi.getEvmStorage('some_address', 'some_slot')

      expect(unsafeApi.query.EVM.AccountStorages.getKey).toHaveBeenCalledWith(
        'some_address',
        'some_slot'
      )
      expect(storage).toBe(3000n)
    })
  })

  describe('clone', () => {
    it('should return a new instance of PapiApi', () => {
      const cloneApi = papiApi.clone()
      expect(cloneApi).toBeInstanceOf(PapiApi)
      expect(cloneApi).not.toBe(papiApi)
    })
  })

  describe('createChainClient', () => {
    it('should create a PolkadotClient instance for the provided chain', async () => {
      const apiInstance = await papiApi.createApiForChain('Acala')

      expect(apiInstance).toBeDefined()
    })
  })

  describe('disconnect', () => {
    const spyDestroy = () => vi.spyOn(mockPolkadotClient, 'destroy').mockResolvedValue()

    it('releases (does NOT destroy) when _api is a string and force = false', async () => {
      const destroySpy = spyDestroy()

      papiApi = new PapiApi('ws://example:9944')

      await papiApi.disconnect(false)

      expect(destroySpy).not.toHaveBeenCalled()
    })

    it('releases (does NOT destroy) when _api is undefined and force = false', async () => {
      papiApi = new PapiApi()
      await papiApi.init(mockChain)

      const providersSpy = vi.mocked(getChainProviders).mockReturnValue(['ws://dummy:9944'])

      const destroySpy = spyDestroy()

      await papiApi.disconnect(false)

      expect(providersSpy).toHaveBeenCalledWith('Acala')
      expect(destroySpy).not.toHaveBeenCalled()

      providersSpy.mockRestore()
    })

    it('destroys when _api is a string and force = true', async () => {
      const destroySpy = spyDestroy()

      papiApi = new PapiApi('ws://example:9944')

      const leaseClientSpy = vi.spyOn(papiApi, 'leaseClient').mockResolvedValue(mockPolkadotClient)

      await papiApi.init(mockChain)
      await papiApi.disconnect(true)

      expect(destroySpy).toHaveBeenCalledTimes(1)

      leaseClientSpy.mockRestore()
    })

    it('does NOT destroy when _api is an injected client and force = false', async () => {
      const destroySpy = spyDestroy()

      papiApi = new PapiApi(mockPolkadotClient)
      await papiApi.disconnect(false)

      expect(destroySpy).not.toHaveBeenCalled()
    })

    it('destroys when _api is an injected client AND force = true', async () => {
      const destroySpy = spyDestroy()

      papiApi = new PapiApi(mockPolkadotClient)
      await papiApi.init(mockChain)
      await papiApi.disconnect(true)

      expect(destroySpy).toHaveBeenCalledTimes(1)
    })

    it('does nothing when disconnectAllowed = false and force = false', async () => {
      const destroySpy = spyDestroy()

      papiApi = new PapiApi('ws://example:9944')
      papiApi.disconnectAllowed = false
      await papiApi.disconnect(false)

      expect(destroySpy).not.toHaveBeenCalled()
    })
  })

  describe('getDeliveryFee', () => {
    const chain: TSubstrateChain = 'Moonbeam'
    const baseAsset: TAssetInfo = {
      symbol: 'GLMR',
      decimals: 18,
      location: { parents: 0, interior: { Here: null } }
    }

    beforeEach(() => {
      const unsafeApi = papiApi.api.getUnsafeApi()
      unsafeApi.apis.XcmPaymentApi.query_delivery_fees = vi.fn().mockResolvedValue({
        value: { value: [{ fun: { value: 7n } }] }
      })

      vi.mocked(addXcmVersionHeader).mockImplementation((location: unknown) => ({
        V4: location
      }))

      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR',
        decimals: 18,
        location: { parents: 0, interior: { Here: null } }
      })

      vi.mocked(localizeLocation).mockImplementation((_, loc: TLocation) => loc)

      vi.mocked(isAssetXcEqual)?.mockReturnValue(true)
    })

    it('adds delivery fee directly when asset is native', async () => {
      const unsafeApi = papiApi.api.getUnsafeApi()
      const forwardedXcm = [
        {
          /* msg */
        },
        [
          {
            /* dest */
          }
        ]
      ]

      const res = await papiApi.getDeliveryFee(
        chain,
        forwardedXcm,
        baseAsset,
        baseAsset.location,
        Version.V5
      )

      expect(unsafeApi.apis.XcmPaymentApi.query_delivery_fees).toHaveBeenCalled()
      expect(res).toBe(7n)
    })

    it('converts delivery fee via queryRuntimeApi when asset is NOT native', async () => {
      const forwardedXcm = [{}, [{}]]
      vi.mocked(isAssetXcEqual).mockReturnValue(false)

      const quoteSpy = vi.spyOn(papiApi, 'queryRuntimeApi').mockResolvedValue(5n)

      const asset: TAssetInfo = {
        symbol: 'USDC',
        decimals: 6,
        location: { parents: 1, interior: { X1: { Parachain: 1000 } } }
      }

      const res = await papiApi.getDeliveryFee(
        chain,
        forwardedXcm,
        asset,
        asset.location,
        Version.V5
      )

      expect(quoteSpy).toHaveBeenCalled()
      expect(res).toBe(5n)
    })

    it('returns zero when forwardedXcm is empty (no delivery fee)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const forwardedXcm: any = []
      const res = await papiApi.getDeliveryFee(
        chain,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        forwardedXcm,
        baseAsset,
        baseAsset.location,
        Version.V5
      )
      expect(res).toBe(0n)
    })

    it('returns 0n when delivery fee response type is Unimplemented', async () => {
      const unsafeApi = papiApi.api.getUnsafeApi()
      const forwardedXcm = [{}, [{}]]

      vi.mocked(unsafeApi.apis.XcmPaymentApi.query_delivery_fees).mockResolvedValue({
        value: { type: 'Unimplemented' }
      })

      const res = await papiApi.getDeliveryFee(
        chain,
        forwardedXcm,
        baseAsset,
        baseAsset.location,
        Version.V5
      )

      expect(res).toBe(0n)
    })

    it('falls back to 0 delivery fee when queryRuntimeApi throws the runtime-entry error', async () => {
      const forwardedXcm = [{}, [{}]]
      vi.mocked(isAssetXcEqual).mockReturnValue(false)

      vi.spyOn(papiApi, 'queryRuntimeApi').mockRejectedValue(
        new Error(
          'Runtime entry RuntimeCall(AssetConversionApi.quote_price_exact_tokens_for_tokens) not found'
        )
      )

      const asset: TAssetInfo = {
        symbol: 'USDT',
        decimals: 6,
        location: { parents: 1, interior: { X1: { Parachain: 1001 } } }
      }

      const res = await papiApi.getDeliveryFee(
        chain,
        forwardedXcm,
        asset,
        asset.location,
        Version.V5
      )

      expect(res).toBe(0n)
    })

    it('falls back to 0 delivery fee when queryRuntimeApi throws an unexpected error', async () => {
      const forwardedXcm = [{}, [{}]]
      vi.mocked(isAssetXcEqual).mockReturnValue(false)

      vi.spyOn(papiApi, 'queryRuntimeApi').mockRejectedValue(new Error('network flake'))

      const asset: TAssetInfo = {
        symbol: 'USDT',
        decimals: 6,
        location: { parents: 1, interior: { X1: { Parachain: 1001 } } }
      }

      const res = await papiApi.getDeliveryFee(
        chain,
        forwardedXcm,
        asset,
        asset.location,
        Version.V5
      )

      expect(res).toBe(0n)
    })

    it('retries query_delivery_fees with a 3rd param when runtime-api throws undefined access error', async () => {
      const unsafeApi = papiApi.api.getUnsafeApi()

      const forwardedXcm0 = { some: 'xcm0' }
      const forwardedXcm1 = { some: 'xcm1' }
      const forwardedXcm: unknown[] = [forwardedXcm0, [forwardedXcm1]]

      const transformedThird = { transformedThird: true }
      vi.mocked(transform).mockReturnValueOnce(transformedThird)

      vi.mocked(unsafeApi.apis.XcmPaymentApi.query_delivery_fees)
        .mockRejectedValueOnce(new Error('Incompatible runtime entry'))
        .mockResolvedValueOnce({ value: { value: [{ fun: { value: 9n } }] } })

      const res = await papiApi.getDeliveryFee(
        chain,
        forwardedXcm,
        baseAsset,
        baseAsset.location,
        Version.V5
      )

      expect(unsafeApi.apis.XcmPaymentApi.query_delivery_fees).toHaveBeenCalledTimes(2)
      expect(unsafeApi.apis.XcmPaymentApi.query_delivery_fees).toHaveBeenNthCalledWith(
        1,
        forwardedXcm0,
        forwardedXcm1
      )
      expect(addXcmVersionHeader).toHaveBeenCalledWith(baseAsset.location, Version.V5)
      expect(transform).toHaveBeenCalledTimes(1)
      expect(unsafeApi.apis.XcmPaymentApi.query_delivery_fees).toHaveBeenNthCalledWith(
        2,
        forwardedXcm0,
        forwardedXcm1,
        transformedThird
      )
      expect(res).toBe(9n)
    })

    it('re-throws when query_delivery_fees fails with an unexpected error', async () => {
      const unsafeApi = papiApi.api.getUnsafeApi()

      const forwardedXcm0 = { some: 'xcm0' }
      const forwardedXcm1 = { some: 'xcm1' }
      const forwardedXcm: unknown[] = [forwardedXcm0, [forwardedXcm1]]

      vi.mocked(unsafeApi.apis.XcmPaymentApi.query_delivery_fees).mockRejectedValueOnce(
        new Error('some other runtime error')
      )

      await expect(
        papiApi.getDeliveryFee(chain, forwardedXcm, baseAsset, baseAsset.location, Version.V5)
      ).rejects.toThrow('some other runtime error')

      expect(unsafeApi.apis.XcmPaymentApi.query_delivery_fees).toHaveBeenCalledTimes(1)
      expect(addXcmVersionHeader).not.toHaveBeenCalled()
      expect(transform).not.toHaveBeenCalled()
    })
  })

  describe('getXcmPaymentApiFee', () => {
    const chain: TSubstrateChain = 'Moonbeam'
    const localXcm = { type: 'V4', value: [] }
    const baseAsset: TAssetInfo = {
      symbol: 'GLMR',
      decimals: 18,
      location: { parents: 0, interior: { Here: null } }
    }

    beforeEach(() => {
      const unsafeApi = papiApi.api.getUnsafeApi()
      unsafeApi.apis.XcmPaymentApi.query_weight_to_asset_fee = vi
        .fn()
        .mockResolvedValue({ value: 100n })
      unsafeApi.apis.XcmPaymentApi.query_xcm_weight = vi.fn().mockResolvedValue({
        success: true,
        value: { ref_time: 100n, proof_size: 200n }
      })

      vi.mocked(localizeLocation).mockImplementation((_, loc: TLocation) => loc)

      vi.spyOn(papiApi, 'getDeliveryFee').mockResolvedValue(0n)
    })

    it('adds delivery fee to exec fee', async () => {
      const forwardedXcm = [{}, [{}]]
      const deliverySpy = vi.spyOn(papiApi, 'getDeliveryFee').mockResolvedValueOnce(7n)

      const res = await papiApi.getXcmPaymentApiFee(
        chain,
        localXcm,
        forwardedXcm,
        baseAsset,
        Version.V5
      )

      expect(deliverySpy).toHaveBeenCalled()
      expect(res).toBe(107n)
    })

    it('uses BridgeHub fallback helper when exec fee asset is missing', async () => {
      const bridgeChain: TSubstrateChain = 'BridgeHubPolkadot'
      const unsafeApi = papiApi.api.getUnsafeApi()

      unsafeApi.apis.XcmPaymentApi.query_weight_to_asset_fee = vi
        .fn()
        .mockResolvedValue({ success: false, value: { type: 'AssetNotFound' } })

      unsafeApi.apis.XcmPaymentApi.query_xcm_weight = vi.fn().mockResolvedValue({
        success: true,
        value: { ref_time: 100n, proof_size: 200n }
      })

      const fallbackSpy = vi.spyOn(papiApi, 'getBridgeHubFallbackExecFee').mockResolvedValue(33n)

      const res = await papiApi.getXcmPaymentApiFee(
        bridgeChain,
        localXcm,
        [],
        baseAsset,
        Version.V5
      )

      expect(fallbackSpy).toHaveBeenCalledWith(
        bridgeChain,
        { ref_time: 100n, proof_size: 200n },
        baseAsset,
        Version.V5
      )
      expect(res).toBe(33n)
    })

    it('returns zero when BridgeHub fallback is unavailable', async () => {
      const bridgeChain: TSubstrateChain = 'BridgeHubPolkadot'
      const unsafeApi = papiApi.api.getUnsafeApi()

      unsafeApi.apis.XcmPaymentApi.query_weight_to_asset_fee = vi
        .fn()
        .mockResolvedValue({ success: false, value: { type: 'AssetNotFound' } })

      unsafeApi.apis.XcmPaymentApi.query_xcm_weight = vi.fn().mockResolvedValue({
        success: true,
        value: { ref_time: 100n, proof_size: 200n }
      })

      const fallbackSpy = vi
        .spyOn(papiApi, 'getBridgeHubFallbackExecFee')
        .mockResolvedValue(undefined)

      const res = await papiApi.getXcmPaymentApiFee(
        bridgeChain,
        localXcm,
        [],
        baseAsset,
        Version.V5
      )

      expect(fallbackSpy).toHaveBeenCalledWith(
        bridgeChain,
        { ref_time: 100n, proof_size: 200n },
        baseAsset,
        Version.V5
      )
      expect(res).toBe(0n)
    })
  })

  describe('getBridgeHubFallbackExecFee', () => {
    const chain: TSubstrateChain = 'BridgeHubPolkadot'
    const weightValue = { ref_time: 11n, proof_size: 22n }
    const asset: TAssetInfo = {
      symbol: 'DOT',
      decimals: 10,
      location: {
        parents: 1,
        interior: { X1: [{ Parachain: 1000 }] }
      }
    }

    it('converts relay fee via AssetHub and returns bigint', async () => {
      const fallbackFee = 777n
      const convertedFee = 999n
      const localizedLoc = { parents: 0, interior: { Here: null } }

      const unsafeApi = papiApi.api.getUnsafeApi()
      const queryFeeMock = unsafeApi.apis.XcmPaymentApi.query_weight_to_asset_fee as unknown as Mock
      queryFeeMock.mockResolvedValueOnce({ value: fallbackFee })

      vi.mocked(localizeLocation).mockReturnValueOnce(localizedLoc)

      const ahApiMock = {
        init: vi.fn().mockResolvedValue(undefined),
        queryRuntimeApi: vi.fn().mockResolvedValue(convertedFee)
      } as unknown as PapiApi

      const cloneSpy = vi.spyOn(papiApi, 'clone').mockReturnValue(ahApiMock)

      const ahInitSpy = vi.spyOn(ahApiMock, 'init')
      const ahQuoteSpy = vi.spyOn(ahApiMock, 'queryRuntimeApi')

      const res = await papiApi.getBridgeHubFallbackExecFee(chain, weightValue, asset, Version.V4)

      expect(queryFeeMock).toHaveBeenCalledWith(
        weightValue,
        expect.objectContaining({ type: Version.V4 })
      )
      expect(transform).toHaveBeenCalledWith(RELAY_LOCATION)
      expect(cloneSpy).toHaveBeenCalledTimes(1)
      expect(ahInitSpy).toHaveBeenCalledWith('AssetHubPolkadot')
      expect(localizeLocation).toHaveBeenCalledWith('AssetHubPolkadot', asset.location)
      expect(ahQuoteSpy).toHaveBeenCalledWith({
        module: 'AssetConversionApi',
        method: 'quote_price_exact_tokens_for_tokens',
        params: [RELAY_LOCATION, localizedLoc, fallbackFee, false]
      })
      expect(res).toBe(convertedFee)
    })

    it('returns undefined when fallback fee or conversion is unavailable', async () => {
      const unsafeApi = papiApi.api.getUnsafeApi()
      const queryFeeMock = unsafeApi.apis.XcmPaymentApi.query_weight_to_asset_fee as unknown as Mock
      queryFeeMock.mockResolvedValueOnce({ value: undefined })

      const resWithoutFee = await papiApi.getBridgeHubFallbackExecFee(
        chain,
        weightValue,
        asset,
        Version.V5
      )
      expect(resWithoutFee).toBeUndefined()

      queryFeeMock.mockResolvedValueOnce({ value: 123n })

      const ahApiMock = {
        init: vi.fn().mockResolvedValue(undefined),
        queryRuntimeApi: vi.fn().mockResolvedValue(undefined)
      } as unknown as PapiApi

      vi.spyOn(papiApi, 'clone').mockReturnValue(ahApiMock)

      const resWithoutConversion = await papiApi.getBridgeHubFallbackExecFee(
        chain,
        weightValue,
        asset,
        Version.V5
      )

      expect(resWithoutConversion).toBeUndefined()
    })
  })

  describe('accountToHex', () => {
    it('should return the hex representation of the account - prefixed', () => {
      const account = 'some_account'
      const hexAccount = '0x1234567890abcdef'
      const encoded = new Uint8Array([1, 2, 3])

      vi.mocked(AccountId).mockReturnValue({
        enc: vi.fn().mockReturnValue(encoded)
      } as unknown as Codec<SS58String>)
      vi.mocked(toHex).mockReturnValue(hexAccount)

      const result = papiApi.accountToHex(account)

      expect(AccountId).toHaveBeenCalled()
      expect(toHex).toHaveBeenCalledWith(encoded)
      expect(result).toBe(hexAccount)
    })

    it('should return the account if the output should not start with 0x', () => {
      const account = 'some_account'
      const hexAccount = '1234567890abcdef'

      const spy = vi.spyOn(papiApi, 'accountToHex').mockReturnValue(hexAccount)

      const result = papiApi.accountToHex(account, false)

      expect(spy).toHaveBeenCalledWith(account, false)
      expect(result).toBe('1234567890abcdef')
    })
  })

  describe('accountToUint8a', () => {
    it('returns the public key bytes when the SS58 address is valid', () => {
      const addr = '5FHneW46xGXgs5mUiveU4sbTyGBzmst2oT29E5c9F7NYtiLP'
      const publicKey = new Uint8Array([1, 2, 3, 4])

      vi.mocked(getSs58AddressInfo).mockReturnValue({
        isValid: true,
        publicKey,
        ss58Format: 42
      })

      const res = papiApi.accountToUint8a(addr)

      expect(getSs58AddressInfo).toHaveBeenCalledWith(addr)
      expect(res).toEqual(publicKey)
    })

    it('throws InvalidAddressError when the address is invalid (isValid: false)', () => {
      const badAddr = 'invalid_address'

      vi.mocked(getSs58AddressInfo).mockReturnValue({
        isValid: false
      })

      expect(() => papiApi.accountToUint8a(badAddr)).toThrow(InvalidAddressError)
      expect(() => papiApi.accountToUint8a(badAddr)).toThrow('Invalid address: invalid_address')
      expect(getSs58AddressInfo).toHaveBeenCalledWith(badAddr)
    })
  })

  describe('validateSubstrateAddress', () => {
    it('returns true when the address is valid', () => {
      const addr = '5FHneW46xGXgs5mUiveU4sbTyGBzmst2oT29E5c9F7NYtiLP'

      vi.mocked(getSs58AddressInfo).mockReturnValue({
        isValid: true,
        publicKey: new Uint8Array([1, 2, 3, 4]),
        ss58Format: 42
      })

      const result = papiApi.validateSubstrateAddress(addr)

      expect(result).toBe(true)
      expect(getSs58AddressInfo).toHaveBeenCalledWith(addr)
    })

    it('returns false when the address is invalid (isValid: false)', () => {
      const badAddr = 'invalid_address'

      vi.mocked(getSs58AddressInfo).mockReturnValue({
        isValid: false
      })

      const result = papiApi.validateSubstrateAddress(badAddr)

      expect(result).toBe(false)
      expect(getSs58AddressInfo).toHaveBeenCalledWith(badAddr)
    })
  })

  describe('getMethodName', () => {
    it('should return the method name from the transaction', () => {
      const methodName = 'methodName'
      const mockTransaction = {
        decodedCall: {
          value: {
            type: 'methodName'
          }
        }
      } as unknown as TPapiTransaction

      const result = papiApi.getMethod(mockTransaction)

      expect(result).toBe(methodName)
    })
  })

  describe('getTypeThenAssetCount', () => {
    it('returns undefined when transaction is not transfer_assets_using_type_and_then', () => {
      const tx = {
        decodedCall: {
          value: {
            type: 'transfer_assets',
            value: {
              assets: {
                value: [{}, {}]
              }
            }
          }
        }
      } as unknown as TPapiTransaction

      expect(papiApi.getTypeThenAssetCount(tx)).toBeUndefined()
    })

    it('returns asset count when transaction is transfer_assets_using_type_and_then', () => {
      const assets = [{}, {}, {}]
      const tx = {
        decodedCall: {
          value: {
            type: 'transfer_assets_using_type_and_then',
            value: {
              assets: {
                value: assets
              }
            }
          }
        }
      } as unknown as TPapiTransaction

      expect(papiApi.getTypeThenAssetCount(tx)).toBe(assets.length)
    })
  })

  describe('txFromHex', () => {
    it('should return a transaction object from the hex string', async () => {
      const hexString = '0xdeadbeef'
      const binaryData = new Uint8Array([0xde, 0xad, 0xbe, 0xef])

      vi.mocked(Binary.fromHex).mockReturnValue(binaryData)

      const unsafeApi = papiApi.api.getUnsafeApi()
      const spy = vi.spyOn(unsafeApi, 'txFromCallData')

      const result = await papiApi.txFromHex(hexString)

      expect(Binary.fromHex).toHaveBeenCalledWith(hexString)
      expect(result).toBe(mockTransaction)
      expect(spy).toHaveBeenCalledWith(binaryData)
    })
  })

  describe('txToHex', () => {
    it('should return hex string from encoded transaction data', async () => {
      const encodedData = new Uint8Array([0xab, 0xcd])
      const spy = vi.spyOn(mockTransaction, 'getEncodedData').mockResolvedValue(encodedData)
      vi.mocked(toHex).mockReturnValue('0xabcd')

      const result = await papiApi.txToHex(mockTransaction)

      expect(spy).toHaveBeenCalled()
      expect(toHex).toHaveBeenCalledWith(encodedData)
      expect(result).toBe('0xabcd')
    })
  })

  describe('getDryRunCall', () => {
    let dryRunApiCallMock: Mock
    const testAddress = 'some_address'

    const basePayloadMatcher = {
      type: 'system',
      value: { type: 'Signed', value: testAddress }
    }

    beforeEach(() => {
      vi.mocked(getAssetsObject).mockImplementation(
        chain => ({ supportsDryRunApi: chain === 'Acala' ? false : true }) as TChainAssetsInfo
      )

      dryRunApiCallMock = vi.fn()
      const unsafeApi = papiApi.api.getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_call = dryRunApiCallMock

      vi.mocked(computeOriginFee).mockReturnValue(500n)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should succeed on the first attempt if version is not needed', async () => {
      const successResponse = {
        success: true,
        value: {
          execution_result: {
            success: true,
            value: { actual_weight: { ref_time: 10n, proof_size: 20n } }
          },
          forwarded_xcms: []
        }
      }
      dryRunApiCallMock.mockResolvedValue(successResponse)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        address: testAddress,
        chain: 'Moonbeam',
        destination: 'Acala',
        version: Version.V5,
        asset: {
          symbol: 'GLMR'
        } as WithAmount<TAssetInfo>
      })

      expect(dryRunApiCallMock).toHaveBeenCalledTimes(1)
      expect(dryRunApiCallMock).toHaveBeenCalledWith(
        basePayloadMatcher,
        mockTransaction.decodedCall
      )
      expect(result).toEqual({
        success: true,
        fee: 500n,
        asset: { symbol: 'GLMR' } as TAssetInfo,
        weight: { refTime: 10n, proofSize: 20n },
        forwardedXcms: [],
        destParaId: undefined
      })
    })

    it('should retry with version and succeed if first attempt throws Incompatible runtime entry', async () => {
      const successResponseWithVersion = {
        success: true,
        value: {
          execution_result: {
            success: true,
            value: { actual_weight: { ref_time: 30n, proof_size: 40n } }
          },
          forwarded_xcms: [
            [
              {
                type: 'V4',
                value: { interior: { type: 'Here' } }
              }
            ]
          ]
        }
      }

      dryRunApiCallMock
        .mockRejectedValueOnce(new Error('Incompatible runtime entry'))
        .mockResolvedValueOnce(successResponseWithVersion)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'DOT'
      } as TAssetInfo)

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        address: testAddress,
        chain: 'AssetHubPolkadot',
        destination: 'Acala',
        version: Version.V5,
        asset: {
          symbol: 'DOT'
        } as WithAmount<TAssetInfo>
      })

      expect(dryRunApiCallMock).toHaveBeenCalledTimes(2)
      expect(dryRunApiCallMock).toHaveBeenNthCalledWith(
        1,
        basePayloadMatcher,
        mockTransaction.decodedCall
      )
      expect(dryRunApiCallMock).toHaveBeenNthCalledWith(
        2,
        basePayloadMatcher,
        mockTransaction.decodedCall,
        5
      )
      expect(result).toEqual({
        success: true,
        fee: 500n,
        asset: { symbol: 'DOT' } as TAssetInfo,
        weight: { refTime: 30n, proofSize: 40n },
        forwardedXcms: [{ type: 'V4', value: { interior: { type: 'Here' } } }],
        destParaId: 0
      })
    })

    it('skips XcmPaymentApi on system chains (falls back to computeOriginFee)', async () => {
      vi.mocked(hasXcmPaymentApiSupport).mockReturnValue(true)
      vi.mocked(isSystemChain).mockReturnValue(true)

      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'DOT',
        location: { parents: 1, interior: { Here: null } }
      } as TAssetInfo)

      const unsafeApi = papiApi.api.getUnsafeApi()
      const successWithLocalXcm = {
        success: true,
        value: {
          execution_result: {
            success: true,
            value: { actual_weight: { ref_time: 10n, proof_size: 20n } }
          },
          local_xcm: { type: 'V4', value: [] },
          forwarded_xcms: []
        }
      }
      unsafeApi.apis.DryRunApi.dry_run_call = vi.fn().mockResolvedValue(successWithLocalXcm)

      const xcmPaymentSpy = vi.spyOn(papiApi, 'getXcmPaymentApiFee')

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        address: 'some_address',
        chain: 'Polkadot',
        destination: 'Acala',
        version: Version.V5,
        asset: { symbol: 'DOT' } as WithAmount<TAssetInfo>
      })

      expect(result).toEqual({
        success: true,
        fee: 500n,
        asset: expect.objectContaining({ symbol: 'DOT' }),
        weight: { refTime: 10n, proofSize: 20n },
        forwardedXcms: [],
        destParaId: undefined
      })

      expect(xcmPaymentSpy).not.toHaveBeenCalled()
    })

    it('should retry with version and still fail if retry attempt also fails', async () => {
      const retryFailedResponse = {
        success: true,
        value: {
          execution_result: {
            success: false,
            value: { error: { value: { type: 'SomeOtherErrorAfterRetry' } } }
          }
        }
      }

      dryRunApiCallMock
        .mockRejectedValueOnce(new Error('Incompatible runtime entry'))
        .mockResolvedValueOnce(retryFailedResponse)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        address: testAddress,
        chain: 'Kusama',
        destination: 'Acala',
        version: Version.V5,
        asset: {
          symbol: 'KSM'
        } as WithAmount<TAssetInfo>
      })

      expect(dryRunApiCallMock).toHaveBeenCalledTimes(2)
      expect(dryRunApiCallMock).toHaveBeenNthCalledWith(
        1,
        basePayloadMatcher,
        mockTransaction.decodedCall
      )
      expect(dryRunApiCallMock).toHaveBeenNthCalledWith(
        2,
        basePayloadMatcher,
        mockTransaction.decodedCall,
        5
      )
      expect(result).toEqual({
        success: false,
        failureReason: 'SomeOtherErrorAfterRetry',
        asset: { symbol: 'GLMR' } as TAssetInfo
      })
    })

    it('should fail on the first attempt and not retry if error is not VersionedConversionFailed', async () => {
      const otherErrorResponse = {
        success: true,
        value: {
          execution_result: {
            success: false,
            value: { error: { value: { type: 'NotVersionedConversion' } } }
          }
        }
      }
      dryRunApiCallMock.mockResolvedValue(otherErrorResponse)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        address: testAddress,
        chain: 'Moonbeam',
        destination: 'Acala',
        version: Version.V5,
        asset: {
          symbol: 'USDT'
        } as WithAmount<TAssetInfo>
      })

      expect(dryRunApiCallMock).toHaveBeenCalledTimes(1)
      expect(dryRunApiCallMock).toHaveBeenCalledWith(
        basePayloadMatcher,
        mockTransaction.decodedCall
      )
      expect(result).toEqual({
        success: false,
        failureReason: 'NotVersionedConversion',
        asset: { symbol: 'GLMR' } as TAssetInfo
      })
    })

    it('should extract failure reason when error has a direct type (execution_result.value.error.type)', async () => {
      const directTypeErrorResponse = {
        success: true,
        value: {
          execution_result: {
            success: false,
            value: { error: { type: 'DirectTypeError' } }
          }
        }
      }

      dryRunApiCallMock.mockResolvedValue(directTypeErrorResponse)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        address: testAddress,
        chain: 'Moonbeam',
        destination: 'Acala',
        version: Version.V5,
        asset: {
          symbol: 'USDT'
        } as WithAmount<TAssetInfo>
      })

      expect(dryRunApiCallMock).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        success: false,
        failureReason: 'DirectTypeError',
        asset: { symbol: 'GLMR' } as TAssetInfo
      })
    })

    it('should correctly parse failure reason from short error structure', async () => {
      const mockApiResponse = {
        success: true,
        value: {
          type: 'ShortErrorType',
          execution_result: { success: false }
        }
      }
      dryRunApiCallMock.mockResolvedValue(mockApiResponse)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        address: testAddress,
        chain: 'Moonbeam',
        destination: 'Acala',
        version: Version.V5,
        asset: {
          symbol: 'USDT'
        } as WithAmount<TAssetInfo>
      })
      expect(dryRunApiCallMock).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        success: false,
        failureReason: 'ShortErrorType',
        asset: { symbol: 'GLMR' } as TAssetInfo
      })
    })

    it('should extract failure sub reason when nested error contains inner type', async () => {
      const nestedError = {
        type: 'Module',
        value: {
          error: {
            type: 'Token'
          }
        }
      }

      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            success: false,
            value: {
              error: {
                value: {
                  value: nestedError
                }
              }
            }
          }
        }
      }

      dryRunApiCallMock.mockResolvedValue(mockApiResponse)
      const nativeAsset = { symbol: 'GLMR' } as TAssetInfo
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue(nativeAsset)

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        address: testAddress,
        chain: 'Moonbeam',
        destination: 'Acala',
        version: Version.V5,
        asset: {
          symbol: 'USDT'
        } as WithAmount<TAssetInfo>
      })

      expect(result).toEqual({
        success: false,
        failureReason: 'Module',
        failureSubReason: 'Token',
        asset: nativeAsset
      })
    })

    it('should extract failure reason from dispatched Utility event result type fallback', async () => {
      const failingEvent = {
        type: 'Utility',
        value: {
          type: 'DispatchedAs',
          value: {
            result: {
              success: false,
              value: {
                value: {
                  type: 'DispatchError'
                }
              }
            }
          }
        }
      }

      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            success: true,
            value: { actual_weight: { ref_time: 0n, proof_size: 0n } }
          },
          emitted_events: [failingEvent],
          forwarded_xcms: []
        }
      }

      dryRunApiCallMock.mockResolvedValue(mockApiResponse)

      const nativeAsset = { symbol: 'GLMR' } as TAssetInfo
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue(nativeAsset)

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        address: testAddress,
        chain: 'Moonbeam',
        destination: 'Acala',
        version: Version.V5,
        asset: {
          symbol: 'USDT'
        } as WithAmount<TAssetInfo>
      })

      expect(dryRunApiCallMock).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        success: false,
        failureReason: 'DispatchError',
        asset: nativeAsset
      })
    })

    it('should wrap tx if useRootOrigin is true', async () => {
      const successResponse = {
        success: true,
        value: {
          execution_result: {
            success: true,
            value: { actual_weight: { ref_time: 10n, proof_size: 20n } }
          },
          forwarded_xcms: []
        }
      }
      dryRunApiCallMock.mockResolvedValue(successResponse)
      vi.mocked(wrapTxBypass).mockResolvedValue(mockTransaction)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        address: testAddress,
        chain: 'Moonbeam',
        destination: 'Acala',
        useRootOrigin: true,
        version: Version.V5,
        asset: {
          symbol: 'GLMR'
        } as WithAmount<TAssetInfo>
      })

      expect(dryRunApiCallMock).toHaveBeenCalledTimes(1)
      expect(dryRunApiCallMock).toHaveBeenCalledWith(
        {
          type: 'system',
          value: { type: 'Root' }
        },
        mockTransaction.decodedCall
      )
      expect(result).toEqual({
        success: true,
        fee: 500n,
        asset: { symbol: 'GLMR' } as TAssetInfo,
        weight: { refTime: 10n, proofSize: 20n },
        forwardedXcms: [],
        destParaId: undefined
      })
    })

    it('should correctly parse failure reason from unknown error structure (stringified)', async () => {
      const mockApiResponse = {
        success: true,
        value: {
          someOtherField: 'WithError',
          execution_result: { success: false }
        }
      }
      dryRunApiCallMock.mockResolvedValue(mockApiResponse)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        address: testAddress,
        chain: 'Moonbeam',
        destination: 'Acala',
        version: Version.V5,
        asset: {
          symbol: 'USDT'
        } as WithAmount<TAssetInfo>
      })
      expect(dryRunApiCallMock).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        success: false,
        failureReason: JSON.stringify(mockApiResponse.value),
        asset: { symbol: 'GLMR' } as TAssetInfo
      })
    })

    it('should throw RuntimeApiUnavailable for an unsupported chain', async () => {
      await expect(
        papiApi.getDryRunCall({
          tx: mockTransaction,
          address: testAddress,
          chain: 'Acala',
          destination: 'Acala',
          version: Version.V5,
          asset: {} as WithAmount<TAssetInfo>
        })
      ).rejects.toThrow('Runtime API "DryRunApi" is not available on chain Acala')
      expect(dryRunApiCallMock).not.toHaveBeenCalled()
    })

    it('should correctly parse forwardedXcms and destParaId when XCM is forwarded to a parachain', async () => {
      const successResponseWithForwardedXcm = {
        success: true,
        value: {
          execution_result: {
            success: true,
            value: { actual_weight: { ref_time: 10n, proof_size: 20n } }
          },
          forwarded_xcms: [
            [
              {
                type: 'V4',
                value: {
                  interior: {
                    type: 'X1',
                    value: { type: 'Parachain', value: 2000 }
                  }
                }
              }
            ]
          ]
        }
      }
      dryRunApiCallMock.mockResolvedValue(successResponseWithForwardedXcm)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        address: testAddress,
        chain: 'Moonbeam',
        destination: 'Acala',
        version: Version.V5,
        asset: {} as WithAmount<TAssetInfo>
      })

      expect(dryRunApiCallMock).toHaveBeenCalledTimes(1)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.forwardedXcms).toEqual([
          {
            type: 'V4',
            value: {
              interior: { type: 'X1', value: { type: 'Parachain', value: 2000 } }
            }
          }
        ])
        expect(result.destParaId).toBe(2000)
      }
    })

    it('should use XcmPaymentApi to calculate fee', async () => {
      const successResponseWithForwardedXcm = {
        success: true,
        value: {
          execution_result: {
            success: true,
            value: { actual_weight: { ref_time: 10n, proof_size: 20n } }
          },
          local_xcm: { type: 'V4', value: [] },
          forwarded_xcms: [
            [
              {
                type: 'V4',
                value: {
                  interior: {
                    type: 'X1',
                    value: { type: 'Parachain', value: 2000 }
                  }
                }
              }
            ]
          ]
        }
      }
      dryRunApiCallMock.mockResolvedValue(successResponseWithForwardedXcm)

      vi.mocked(hasXcmPaymentApiSupport).mockReturnValue(true)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        asset: {} as WithAmount<TAssetInfo>,
        address: testAddress,
        chain: 'Moonbeam',
        version: Version.V5,
        destination: 'Acala'
      })

      expect(dryRunApiCallMock).toHaveBeenCalledTimes(1)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.forwardedXcms).toEqual([
          {
            type: 'V4',
            value: {
              interior: { type: 'X1', value: { type: 'Parachain', value: 2000 } }
            }
          }
        ])
        expect(result.destParaId).toBe(2000)
      }
    })

    it('uses tx.getPaymentInfo weight override when local_xcm is missing and fee asset is custom', async () => {
      const successResponse = {
        success: true,
        value: {
          execution_result: {
            success: true,
            value: { actual_weight: { ref_time: 1n, proof_size: 2n } }
          },
          forwarded_xcms: []
          // local_xcm intentionally omitted
        }
      }

      dryRunApiCallMock.mockResolvedValue(successResponse)

      vi.spyOn(mockTransaction, 'getPaymentInfo').mockResolvedValueOnce({
        weight: { ref_time: 123n, proof_size: 456n },
        partial_fee: 0n
      } as Awaited<ReturnType<TPapiTransaction['getPaymentInfo']>>)

      const customAsset = {
        symbol: 'USDC',
        location: { parents: Parents.ZERO, interior: 'Here' }
      } as TAssetInfo

      vi.mocked(hasXcmPaymentApiSupport).mockReturnValue(true)

      vi.spyOn(papiApi, 'resolveFeeAsset').mockResolvedValue({
        asset: customAsset,
        isCustomAsset: true
      })

      const getXcmPaymentApiFeeSpy = vi
        .spyOn(papiApi, 'getXcmPaymentApiFee')
        .mockResolvedValue(999n)

      const paymentInfoSpy = vi.spyOn(mockTransaction, 'getPaymentInfo')

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        asset: customAsset as WithAmount<TAssetInfo>,
        address: testAddress,
        chain: 'Moonbeam',
        version: Version.V5,
        destination: 'Acala'
      })

      expect(paymentInfoSpy).toHaveBeenCalledWith(testAddress)
      expect(getXcmPaymentApiFeeSpy).toHaveBeenCalledWith(
        'Moonbeam',
        undefined,
        [],
        customAsset,
        Version.V5,
        false,
        { refTime: 123n, proofSize: 456n }
      )
      expect(result).toEqual({
        success: true,
        fee: 999n,
        asset: customAsset,
        weight: { refTime: 1n, proofSize: 2n },
        forwardedXcms: [],
        destParaId: undefined
      })
    })

    it('falls back to native asset when MultiTransactionPayment fee lookup fails', async () => {
      const localXcm = { type: 'V4', value: [] }
      const successResponse = {
        success: true,
        value: {
          execution_result: {
            success: true,
            value: { actual_weight: { ref_time: 1n, proof_size: 2n } }
          },
          local_xcm: localXcm,
          forwarded_xcms: []
        }
      }

      dryRunApiCallMock.mockResolvedValue(successResponse)

      const nativeAsset = {
        symbol: 'HYDR',
        location: { parents: Parents.ZERO, interior: 'Here' }
      } as TAssetInfo
      const multiAsset = {
        symbol: 'USDC',
        location: { parents: Parents.ZERO, interior: 'Here' }
      } as TAssetInfo

      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue(nativeAsset)
      vi.mocked(hasXcmPaymentApiSupport).mockReturnValue(true)

      const resolveFeeAssetSpy = vi
        .spyOn(papiApi, 'resolveFeeAsset')
        .mockResolvedValue({ asset: multiAsset, isCustomAsset: true })

      const getXcmPaymentApiFeeSpy = vi
        .spyOn(papiApi, 'getXcmPaymentApiFee')
        .mockResolvedValue(undefined as unknown as bigint)

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        address: testAddress,
        chain: 'Hydration',
        destination: 'Moonbeam',
        version: Version.V5,
        asset: multiAsset as WithAmount<TAssetInfo>
      })

      expect(getXcmPaymentApiFeeSpy).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        success: true,
        fee: 500n,
        asset: nativeAsset,
        weight: { refTime: 1n, proofSize: 2n },
        forwardedXcms: [],
        destParaId: undefined
      })

      resolveFeeAssetSpy.mockRestore()
      getXcmPaymentApiFeeSpy.mockRestore()
    })
  })

  describe('getXcmWeight', () => {
    it('should return the weight for a given XCM payload', async () => {
      const mockXcmPayload = { some: 'xcm-payload' }
      const mockWeight = { ref_time: 100n, proof_size: 200n }
      const unsafeApi = papiApi.api.getUnsafeApi()
      unsafeApi.apis.XcmPaymentApi.query_xcm_weight = vi.fn().mockResolvedValue({
        success: true,
        value: mockWeight
      })
      vi.mocked(transform).mockReturnValue({ some: 'xcm-payload' })

      const result = await papiApi.getXcmWeight(mockXcmPayload)

      expect(unsafeApi.apis.XcmPaymentApi.query_xcm_weight).toHaveBeenCalledWith(mockXcmPayload)

      expect(result).toEqual({ refTime: 100n, proofSize: 200n })
    })
  })

  describe('getDryRunXcm', () => {
    const originLocation: TLocation = {
      parents: 0,
      interior: { Here: null }
    }
    const dummyXcm = { some: 'xcm-payload' }

    it('should return success with destination fee, weight and forwarded XCM', async () => {
      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            type: 'Complete',
            value: {
              used: { ref_time: 11n, proof_size: 22n }
            }
          },
          emitted_events: [
            {
              type: 'Balances',
              value: {
                type: 'Issued',
                value: { amount: 999n }
              }
            }
          ],
          forwarded_xcms: [
            [
              {
                type: 'V4',
                value: {
                  parents: 0,
                  interior: {
                    type: 'X1',
                    value: {
                      type: 'Parachain',
                      value: 1000
                    }
                  }
                }
              }
            ]
          ]
        }
      }

      const unsafeApi = papiApi.api.getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_xcm = vi.fn().mockResolvedValue(mockApiResponse)

      const result = await papiApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        tx: mockTransaction,
        chain: 'AssetHubPolkadot',
        origin: 'Hydration',
        asset: { symbol: 'USDT', location: {} } as TAssetInfo
      } as TDryRunXcmBaseOptions<TPapiTransaction>)

      expect(unsafeApi.apis.DryRunApi.dry_run_xcm).toHaveBeenCalledWith(
        transform(originLocation),
        dummyXcm
      )
      expect(result).toEqual({
        success: true,
        fee: 999n,
        asset: { symbol: 'USDT', location: {} } as TAssetInfo,
        weight: { refTime: 11n, proofSize: 22n },
        forwardedXcms: expect.any(Object),
        destParaId: 1000
      })
    })

    it('should return failure with failure reason', async () => {
      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            type: 'Incomplete',
            value: {
              error: { type: 'SomeXcmError' }
            }
          }
        }
      }

      const unsafeApi = papiApi.api.getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_xcm = vi.fn().mockResolvedValue(mockApiResponse)

      const result = await papiApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        tx: mockTransaction,
        asset: { symbol: 'USDT' } as TAssetInfo,
        chain: 'AssetHubPolkadot',
        origin: 'Hydration'
      } as TDryRunXcmBaseOptions<TPapiTransaction>)

      expect(result).toEqual({
        success: false,
        failureReason: 'SomeXcmError',
        asset: { symbol: 'USDT' } as TAssetInfo
      })
    })

    it('should fallback to execution_result.type when no nested error is present', async () => {
      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            type: 'Incomplete',
            value: {
              error: {}
            }
          }
        }
      }

      const unsafeApi = papiApi.api.getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_xcm = vi.fn().mockResolvedValue(mockApiResponse)

      const result = await papiApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        tx: mockTransaction,
        asset: { symbol: 'USDT' } as TAssetInfo,
        chain: 'AssetHubPolkadot',
        origin: 'Hydration'
      } as TDryRunXcmBaseOptions<TPapiTransaction>)

      expect(result).toEqual({
        success: false,
        failureReason: 'Incomplete',
        asset: { symbol: 'USDT' } as TAssetInfo
      })
    })

    it('should throw error for unsupported chain', async () => {
      await expect(
        papiApi.getDryRunXcm({
          originLocation,
          xcm: dummyXcm,
          tx: mockTransaction,
          chain: 'Acala',
          origin: 'Hydration'
        } as TDryRunXcmBaseOptions<TPapiTransaction>)
      ).rejects.toThrow('Runtime API "DryRunApi" is not available on chain Acala')
    })

    it('should calculate fee using (amount - originFee - eventAmount) if isFeeAsset and ForeignAssets.Issued event is found', async () => {
      const mockAssetDetails: TAssetInfo = {
        symbol: 'USDT',
        decimals: 6,
        assetId: 'test-asset-id',
        location: { parents: 0, interior: { Here: null } }
      }
      const testAmount = 10000n
      const testOriginFee = 100n
      const foreignAssetsIssuedAmount = 500n

      const baseOptions: TDryRunXcmBaseOptions<TPapiTransaction> = {
        originLocation: { parents: 0, interior: { Here: null } },
        xcm: { some: 'xcm-payload' },
        tx: mockTransaction,
        chain: 'AssetHubPolkadot',
        origin: 'AssetHubPolkadot',
        asset: mockAssetDetails,
        feeAsset: mockAssetDetails,
        amount: testAmount,
        version: Version.V5,
        originFee: testOriginFee
      }

      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            type: 'Complete',
            value: { used: { ref_time: 10n, proof_size: 20n } }
          },
          emitted_events: [
            {
              type: 'ForeignAssets',
              value: {
                type: 'Issued',
                value: {
                  amount: foreignAssetsIssuedAmount,
                  owner: 'someOwner',
                  asset_id: 'someAssetId'
                }
              }
            },
            {
              type: 'Balances',
              value: {
                type: 'Issued',
                value: { amount: 9999n }
              }
            }
          ],
          forwarded_xcms: []
        }
      }

      vi.mocked(isAssetEqual).mockImplementation((a1, a2) => {
        if (a1 === mockAssetDetails && a2 === mockAssetDetails) {
          return true
        }
        return false
      })

      const unsafeApi = papiApi.api.getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_xcm = vi.fn().mockResolvedValue(mockApiResponse)

      const result = await papiApi.getDryRunXcm(baseOptions)

      const expectedFee = testAmount - testOriginFee - foreignAssetsIssuedAmount

      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.fee).toBe(expectedFee)
        expect(result.weight).toEqual({ refTime: 10n, proofSize: 20n })
      }
      expect(isAssetEqual).toHaveBeenCalledWith(baseOptions.feeAsset, baseOptions.asset)
      expect(unsafeApi.apis.DryRunApi.dry_run_xcm).toHaveBeenCalled()

      vi.mocked(isAssetEqual).mockRestore()
      vi.mocked(getAssetsObject).mockRestore()
    })
  })

  describe('getDryRunXcm', () => {
    const originLocation: TLocation = {
      parents: 0,
      interior: { Here: null }
    }
    const dummyXcm = { some: 'xcm-payload' }

    beforeEach(() => {
      vi.mocked(getAssetsObject).mockImplementation(
        chain => ({ supportsDryRunApi: chain === 'Acala' ? false : true }) as TChainAssetsInfo
      )
    })

    it('should return success with destination fee, weight and forwarded XCM', async () => {
      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            type: 'Complete',
            value: {
              used: { ref_time: 11n, proof_size: 22n }
            }
          },
          emitted_events: [
            {
              type: 'Balances',
              value: {
                type: 'Issued',
                value: { amount: 999n }
              }
            }
          ],
          forwarded_xcms: []
        }
      }

      const unsafeApi = papiApi.api.getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_xcm = vi.fn().mockResolvedValue(mockApiResponse)

      const result = await papiApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        tx: mockTransaction,
        chain: 'AssetHubPolkadot',
        origin: 'Acala',
        asset: { symbol: 'AUSD' }
      } as TDryRunXcmBaseOptions<TPapiTransaction>)

      expect(unsafeApi.apis.DryRunApi.dry_run_xcm).toHaveBeenCalledWith(
        transform(originLocation),
        dummyXcm
      )
      expect(result).toEqual({
        success: true,
        fee: 999n,
        asset: { symbol: 'AUSD' } as TAssetInfo,
        weight: { refTime: 11n, proofSize: 22n },
        forwardedXcms: []
      })
    })

    it('should return failure with failure reason', async () => {
      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            type: 'Incomplete',
            value: {
              error: { type: 'SomeXcmError' }
            }
          }
        }
      }

      const unsafeApi = papiApi.api.getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_xcm = vi.fn().mockResolvedValue(mockApiResponse)

      const result = await papiApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        tx: mockTransaction,
        asset: { symbol: 'AUSD' },
        chain: 'AssetHubPolkadot',
        origin: 'Acala'
      } as TDryRunXcmBaseOptions<TPapiTransaction>)

      expect(result).toEqual({
        success: false,
        failureReason: 'SomeXcmError',
        asset: { symbol: 'AUSD' } as TAssetInfo
      })
    })

    it('should unwrap nested failure reason when dry run returns dispatch error payload', async () => {
      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            type: 'Incomplete',
            value: {
              error: {
                error: {
                  type: 'NotHoldingFees',
                  value: undefined
                },
                index: 2
              }
            }
          }
        }
      }

      const unsafeApi = papiApi.api.getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_xcm = vi.fn().mockResolvedValue(mockApiResponse)

      const result = await papiApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        tx: mockTransaction,
        asset: { symbol: 'AUSD' },
        chain: 'AssetHubPolkadot',
        origin: 'Acala'
      } as TDryRunXcmBaseOptions<TPapiTransaction>)

      expect(result).toEqual({
        success: false,
        failureReason: 'NotHoldingFees',
        asset: { symbol: 'AUSD' } as TAssetInfo
      })
    })

    it('should use processAssetsDepositedEvents for AssetHubPolkadot with non-DOT assets', async () => {
      const originLocation: TLocation = {
        parents: 0,
        interior: { Here: null }
      }
      const dummyXcm = { some: 'xcm-payload' }
      const testAmount = 5000n

      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            type: 'Complete',
            value: {
              used: { ref_time: 11n, proof_size: 22n }
            }
          },
          emitted_events: [
            {
              type: 'Assets',
              value: {
                type: 'Deposited',
                value: { amount: 1000n }
              }
            },
            {
              type: 'Assets',
              value: {
                type: 'Deposited',
                value: { amount: 3000n }
              }
            },
            {
              type: 'Assets',
              value: {
                type: 'Deposited',
                value: { amount: 500n }
              }
            },
            {
              type: 'Balances',
              value: {
                type: 'Issued',
                value: { amount: 999n }
              }
            }
          ],
          forwarded_xcms: []
        }
      }

      const unsafeApi = papiApi.api.getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_xcm = vi.fn().mockResolvedValue(mockApiResponse)

      const result = await papiApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        tx: mockTransaction,
        chain: 'AssetHubPolkadot',
        origin: 'Hydration',
        asset: { symbol: 'USDT' },
        amount: testAmount
      } as TDryRunXcmBaseOptions<TPapiTransaction>)

      expect(unsafeApi.apis.DryRunApi.dry_run_xcm).toHaveBeenCalledWith(
        transform(originLocation),
        dummyXcm
      )

      expect(result).toEqual({
        success: true,
        fee: 4500n,
        asset: { symbol: 'USDT' } as TAssetInfo,
        weight: { refTime: 11n, proofSize: 22n },
        forwardedXcms: [],
        destParaId: undefined
      })
    })

    it('should use processAssetsDepositedEvents for AssetHubPolkadot with DOT assets', async () => {
      const originLocation: TLocation = {
        parents: 0,
        interior: { Here: null }
      }
      const dummyXcm = { some: 'xcm-payload' }
      const testAmount = 5000n

      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            type: 'Complete',
            value: {
              used: { ref_time: 11n, proof_size: 22n }
            }
          },
          emitted_events: [
            {
              type: 'Balances',
              value: {
                type: 'Minted',
                value: { amount: 1000n }
              }
            },
            {
              type: 'Balances',
              value: {
                type: 'Issued',
                value: { amount: 3000n }
              }
            },
            {
              type: 'Assets',
              value: {
                type: 'Deposited',
                value: { amount: 500n }
              }
            },
            {
              type: 'Balances',
              value: {
                type: 'Issued',
                value: { amount: 999n }
              }
            }
          ],
          forwarded_xcms: []
        }
      }

      const unsafeApi = papiApi.api.getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_xcm = vi.fn().mockResolvedValue(mockApiResponse)

      const result = await papiApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        tx: mockTransaction,
        chain: 'AssetHubPolkadot',
        origin: 'Hydration',
        asset: { symbol: 'DOT' },
        amount: testAmount
      } as TDryRunXcmBaseOptions<TPapiTransaction>)

      expect(unsafeApi.apis.DryRunApi.dry_run_xcm).toHaveBeenCalledWith(
        transform(originLocation),
        dummyXcm
      )

      expect(result).toEqual({
        success: true,
        fee: 1300n,
        asset: { symbol: 'DOT' } as TAssetInfo,
        weight: { refTime: 11n, proofSize: 22n },
        forwardedXcms: [],
        destParaId: undefined
      })
    })

    it('should throw error for unsupported chain', async () => {
      await expect(
        papiApi.getDryRunXcm({
          originLocation,
          xcm: dummyXcm,
          tx: mockTransaction,
          chain: 'Acala',
          origin: 'Acala'
        } as TDryRunXcmBaseOptions<TPapiTransaction>)
      ).rejects.toThrow('Runtime API "DryRunApi" is not available on chain Acala')
    })

    it('should throw error if no issued event found', async () => {
      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            type: 'Complete',
            value: {
              used: { ref_time: 11n, proof_size: 22n }
            }
          },
          emitted_events: [],
          forwarded_xcms: []
        }
      }

      const unsafeApi = papiApi.api.getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_xcm = vi.fn().mockResolvedValue(mockApiResponse)

      expect(
        await papiApi.getDryRunXcm({
          originLocation,
          xcm: dummyXcm,
          tx: mockTransaction,
          asset: { symbol: 'USDT' },
          chain: 'AssetHubPolkadot',
          origin: 'Mythos'
        } as TDryRunXcmBaseOptions<TPapiTransaction>)
      ).toEqual({
        success: false,
        failureReason: 'Cannot determine destination fee. No fee event found',
        asset: { symbol: 'USDT' } as TAssetInfo
      })
    })

    it('should get fee from XcmPaymentApi if chain is Moonbeam', () => {
      const weight = { ref_time: 11n, proof_size: 22n }

      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            type: 'Complete',
            value: {
              used: weight
            }
          },
          emitted_events: [],
          forwarded_xcms: []
        }
      }

      vi.mocked(hasXcmPaymentApiSupport).mockReturnValue(true)

      const unsafeApi = papiApi.api.getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_xcm = vi.fn().mockResolvedValue(mockApiResponse)
      unsafeApi.apis.XcmPaymentApi.query_xcm_weight = vi.fn().mockResolvedValue({
        success: true,
        value: weight
      })
      unsafeApi.apis.XcmPaymentApi.query_weight_to_asset_fee = vi.fn().mockResolvedValue({
        value: 100n
      })

      vi.spyOn(papiApi, 'getDeliveryFee').mockResolvedValue(0n)

      return expect(
        papiApi.getDryRunXcm({
          originLocation,
          xcm: dummyXcm,
          tx: mockTransaction,
          chain: 'Moonbeam',
          origin: 'Acala',
          asset: { symbol: 'AUSD', location: { parents: 0, interior: { Here: null } } }
        } as TDryRunXcmBaseOptions<TPapiTransaction>)
      ).resolves.toEqual({
        success: true,
        fee: 100n,
        asset: { symbol: 'AUSD', location: { parents: 0, interior: { Here: null } } } as TAssetInfo,
        weight: { refTime: 11n, proofSize: 22n },
        forwardedXcms: []
      })
    })
  })

  describe('objectToHex', () => {
    it('should return the hex representation of the object', async () => {
      const object = { key1: 'value1', key2: 'value2' }
      const encodedData = new Uint8Array([1, 2, 3, 4, 5])

      const unsafeApi = papiApi.api.getUnsafeApi()
      unsafeApi.tx.PolkadotXcm.send = vi.fn().mockReturnValue({
        getEncodedData: vi.fn().mockResolvedValue(encodedData)
      })

      vi.mocked(toHex).mockReturnValue('0x0000000000abcdef')

      const result = await papiApi.objectToHex(object, 'XcmVersionedXcm', Version.V5)
      expect(toHex).toHaveBeenCalledWith(encodedData)
      expect(result).toBe('0xabcdef')
    })
  })

  describe('hexToUint8a', () => {
    it('should return the Uint8Array representation of the hex', () => {
      const hex = '0x1234567890abcdef'
      const uint8a = new Uint8Array([18, 52, 86, 120, 144, 171, 205, 239])

      const spy = vi.spyOn(Binary, 'fromHex').mockReturnValue(uint8a)

      const result = papiApi.hexToUint8a(hex)

      expect(result).toEqual(uint8a)
      expect(spy).toHaveBeenCalledWith(hex)
    })
  })

  describe('stringToUint8a', () => {
    it('should return the Uint8Array representation of the string', () => {
      const string = 'some_string'
      const uint8a = new Uint8Array([115, 111, 109, 101, 95, 115, 116, 114, 105, 110, 103])

      const spy = vi.spyOn(Binary, 'fromText').mockReturnValue(uint8a)

      const result = papiApi.stringToUint8a(string)

      expect(spy).toHaveBeenCalledWith(string)
      expect(result).toEqual(uint8a)
    })
  })

  describe('blake2AsHex', () => {
    it('should return the hex representation of the blake2 hash', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
      const hex = '0x1234567890abcdef'

      const spy = vi.spyOn(papiApi, 'blake2AsHex').mockReturnValue(hex)

      const result = papiApi.blake2AsHex(data)

      expect(result).toBe(hex)

      expect(spy).toHaveBeenCalledWith(data)
    })
  })

  describe('getFromRpc', () => {
    it('should call _request with correct parameters for non-system module', async () => {
      const module = 'foo'
      const method = 'bar'
      const key = 'nonHexKey'
      const rpcMethod = `${module}_${method}`
      const returnedValue = 123

      vi.mocked(AccountId).mockReturnValue({
        dec: vi.fn().mockReturnValue(key)
      } as unknown as Codec<SS58String>)
      const spy = vi.spyOn(mockPolkadotClient, '_request').mockResolvedValue(returnedValue)

      const result = await papiApi.getFromRpc(module, method, key)

      expect(spy).toHaveBeenCalledWith(rpcMethod, [key])
      expect(result).toBe('0x0000007b')
    })

    it('should call _request with converted key for system module when key is hex', async () => {
      const module = 'system'
      const method = 'doSomething'
      const hexKey = '0xabcdef'
      const fakeDec = vi.fn().mockReturnValue(`ss58(${hexKey})`)
      vi.mocked(AccountId).mockReturnValue({ dec: fakeDec } as unknown as Codec<SS58String>)

      const rpcMethod = `${module}_${method}`
      const returnedValue = '0xdeadbeef'
      const spy = vi.spyOn(mockPolkadotClient, '_request').mockResolvedValue(returnedValue)

      const result = await papiApi.getFromRpc(module, method, hexKey)

      expect(fakeDec).toHaveBeenCalledWith(hexKey)
      expect(spy).toHaveBeenCalledWith(rpcMethod, [`ss58(${hexKey})`])
      expect(result).toBe(returnedValue)
    })
  })

  describe('getBridgeStatus', () => {
    it('should return the bridge status', async () => {
      const status = await papiApi.getBridgeStatus()
      expect(status).toEqual('Normal')
    })
  })

  describe('PapiApi - timed cache integration', () => {
    beforeEach(() => {
      vi.mocked(createWsClient).mockReset()
    })

    it('re-uses the same PolkadotClient and destroys it after refs drop to 0 when destroyWanted=true', async () => {
      vi.useFakeTimers()

      const ws = 'ws://cache-test:9944'
      const sharedClient = {
        destroy: vi.fn(),
        getUnsafeApi: vi.fn().mockReturnValue({}),
        getChainSpecData: vi.fn().mockResolvedValue(undefined)
      } as unknown as ReturnType<typeof createWsClient>

      vi.mocked(createWsClient).mockReturnValue(sharedClient)

      const apiA = new PapiApi(ws)
      await apiA.init('Acala', 1_000) // ttl = 1 s

      const apiB = new PapiApi(ws)
      await apiB.init('Acala', 1_000)

      expect(createWsClient).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(1_001)
      expect(sharedClient.destroy).not.toHaveBeenCalled()

      // release one reference – still 1 left
      await apiA.disconnect()
      expect(sharedClient.destroy).not.toHaveBeenCalled()

      // release last reference – destroyWanted && refs==0 -> real destroy
      await apiB.disconnect()
      expect(sharedClient.destroy).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })

    it('evicts and destroys an idle client after its TTL elapses', async () => {
      vi.useFakeTimers()

      const ws = 'ws://cache-test2:9944'
      const idleClient = {
        destroy: vi.fn(),
        getUnsafeApi: vi.fn().mockReturnValue({}),
        getChainSpecData: vi.fn().mockResolvedValue(undefined)
      } as unknown as ReturnType<typeof createWsClient>
      vi.mocked(createWsClient).mockReturnValue(idleClient)

      const api = new PapiApi(ws)
      await api.init('Acala', 500) // ttl = 0.5 s

      // drop the only reference – entry.refs becomes 0
      await api.disconnect()
      expect(idleClient.destroy).not.toHaveBeenCalled()

      vi.advanceTimersByTime(501)
      expect(idleClient.destroy).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })
  })

  describe('deriveAddress', () => {
    it('should call deriveAddress utility and return address', () => {
      const address = papiApi.deriveAddress('//Alice')
      expect(typeof address).toBe('string')
    })
  })

  describe('signAndSubmit', () => {
    it('should sign and submit a transaction', async () => {
      const mockTxHash = '0x1234567890abcdef'
      const mockTx = {
        signAndSubmit: vi.fn().mockResolvedValue({ txHash: mockTxHash })
      } as unknown as TPapiTransaction

      const spy = vi.spyOn(mockTx, 'signAndSubmit')

      const result = await papiApi.signAndSubmit(mockTx, '//Alice')

      expect(spy).toHaveBeenCalled()
      expect(result).toBe(mockTxHash)
    })
  })

  describe('signAndSubmitFinalized', () => {
    it('should resolve with txHash on finalized event', async () => {
      const mockTxHash = '0xfinalized'
      const mockSubscribe = vi
        .fn()
        .mockImplementation(({ next }: { next: (event: unknown) => void }) => {
          next({ type: 'finalized', ok: true, txHash: mockTxHash })
        })
      const mockTx = {
        signSubmitAndWatch: vi.fn().mockReturnValue({ subscribe: mockSubscribe })
      } as unknown as TPapiTransaction

      const spy = vi.spyOn(mockTx, 'signSubmitAndWatch')

      const result = await papiApi.signAndSubmitFinalized(mockTx, '//Alice')

      expect(spy).toHaveBeenCalled()
      expect(result).toBe(mockTxHash)
    })

    it('should resolve on txBestBlocksState with found', async () => {
      const mockTxHash = '0xbestblock'
      const mockSubscribe = vi
        .fn()
        .mockImplementation(({ next }: { next: (event: unknown) => void }) => {
          next({ type: 'txBestBlocksState', found: true, ok: true, txHash: mockTxHash })
        })
      const mockTx = {
        signSubmitAndWatch: vi.fn().mockReturnValue({ subscribe: mockSubscribe })
      } as unknown as TPapiTransaction

      const result = await papiApi.signAndSubmitFinalized(mockTx, '//Alice')

      expect(result).toBe(mockTxHash)
    })

    it('should reject with SubmitTransactionError on dispatch error', async () => {
      const mockSubscribe = vi
        .fn()
        .mockImplementation(({ next }: { next: (event: unknown) => void }) => {
          next({
            type: 'finalized',
            ok: false,
            dispatchError: { value: { Module: { index: 1, error: 2 } } }
          })
        })
      const mockTx = {
        signSubmitAndWatch: vi.fn().mockReturnValue({ subscribe: mockSubscribe })
      } as unknown as TPapiTransaction

      await expect(papiApi.signAndSubmitFinalized(mockTx, '//Alice')).rejects.toThrow(
        SubmitTransactionError
      )
    })

    it('should reject on subscription error', async () => {
      const mockError = new Error('connection lost')
      const mockSubscribe = vi
        .fn()
        .mockImplementation(({ error }: { error: (err: unknown) => void }) => {
          error(mockError)
        })
      const mockTx = {
        signSubmitAndWatch: vi.fn().mockReturnValue({ subscribe: mockSubscribe })
      } as unknown as TPapiTransaction

      await expect(papiApi.signAndSubmitFinalized(mockTx, '//Alice')).rejects.toThrow(
        'connection lost'
      )
    })

    it('should wrap non-Error subscription errors in SubmitTransactionError', async () => {
      const mockSubscribe = vi
        .fn()
        .mockImplementation(({ error }: { error: (err: unknown) => void }) => {
          error('raw string error')
        })
      const mockTx = {
        signSubmitAndWatch: vi.fn().mockReturnValue({ subscribe: mockSubscribe })
      } as unknown as TPapiTransaction

      await expect(papiApi.signAndSubmitFinalized(mockTx, '//Alice')).rejects.toThrow(
        SubmitTransactionError
      )
    })
  })
})
