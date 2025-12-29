import type {
  TAssetInfo,
  TDryRunXcmBaseOptions,
  TSerializedExtrinsics,
  WithAmount
} from '@paraspell/sdk-core'
import {
  addXcmVersionHeader,
  BatchMode,
  computeFeeFromDryRunPjs,
  findAssetInfoOrThrow,
  findNativeAssetInfoOrThrow,
  getChainProviders,
  getRelayChainOf,
  hasXcmPaymentApiSupport,
  localizeLocation,
  MissingChainApiError,
  RELAY_LOCATION,
  RuntimeApiUnavailableError,
  type TLocation,
  Version,
  wrapTxBypass
} from '@paraspell/sdk-core'
import { ApiPromise } from '@polkadot/api'
import type { VoidFn } from '@polkadot/api/types'
import type { Codec } from '@polkadot/types/types'
import { validateAddress } from '@polkadot/util-crypto'
import type { Mock } from 'vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import PolkadotJsApi from './PolkadotJsApi'
import type { Extrinsic, TPjsApi } from './types'

vi.mock('@paraspell/sdk-core', async importOriginal => ({
  ...(await importOriginal()),
  computeFeeFromDryRunPjs: vi.fn().mockReturnValue(1000n),
  findAssetInfoOrThrow: vi.fn(),
  getChainProviders: vi.fn(),
  resolveModuleError: vi.fn().mockReturnValue({ failureReason: 'ModuleError' }),
  findNativeAssetInfoOrThrow: vi.fn(),
  hasXcmPaymentApiSupport: vi.fn().mockReturnValue(true),
  localizeLocation: vi.fn(),
  getRelayChainOf: vi.fn(),
  wrapTxBypass: vi.fn(),
  addXcmVersionHeader: vi.fn()
}))

vi.mock('@polkadot/api')

vi.mock('@polkadot/util-crypto', async importOriginal => ({
  ...(await importOriginal()),
  validateAddress: vi.fn()
}))

describe('PolkadotJsApi', () => {
  let polkadotApi: PolkadotJsApi
  let mockApiPromise: TPjsApi
  let accountCurrencyMapMock: Mock
  const mockChain = 'Acala'

  beforeEach(async () => {
    vi.mocked(getChainProviders).mockReset()
    vi.mocked(addXcmVersionHeader).mockImplementation((location: unknown) => ({ V4: location }))
    vi.mocked(localizeLocation).mockImplementation(
      (_chain: unknown, location: TLocation, _origin?: unknown) => location
    )
    mockApiPromise = {
      createType: vi.fn().mockReturnValue({
        toHex: vi.fn().mockReturnValue('0x1234567890abcdef')
      }),
      registry: {},
      call: {
        dryRunApi: {
          dryRunCall: vi.fn(),
          dryRunXcm: vi.fn()
        },
        locationToAccountApi: {
          convertLocation: vi.fn()
        },
        xcmPaymentApi: {
          queryXcmWeight: vi.fn(),
          queryWeightToAssetFee: vi.fn(),
          queryDeliveryFees: vi.fn()
        },
        assetConversionApi: {
          quotePriceExactTokensForTokens: vi.fn().mockResolvedValue({
            toJSON: vi.fn().mockResolvedValue(1n),
            toString: vi.fn().mockReturnValue('1')
          })
        }
      },
      rpc: {
        state: {
          getStorage: vi
            .fn()
            .mockResolvedValue({ toHex: vi.fn().mockReturnValue('0x1234567890abcdef') })
        }
      },
      tx: {
        xTokens: {
          transfer: vi.fn().mockReturnValue('mocked_extrinsic')
        },
        utility: {
          batch: vi.fn().mockReturnValue('mocked_utility_extrinsic'),
          batchAll: vi.fn().mockReturnValue('mocked_utility_extrinsic'),
          dispatchAs: vi.fn().mockReturnValue('mocked_utility_extrinsic')
        }
      },
      query: {
        evm: {
          accountStorages: {
            key: vi.fn().mockResolvedValue('0x1234567890abcdef')
          }
        },
        multiTransactionPayment: {
          accountCurrencyMap: vi.fn()
        },
        ethereumOutboundQueue: {
          operatingMode: vi.fn().mockResolvedValue({ toPrimitive: () => 'Normal' })
        }
      },
      disconnect: vi.fn()
    } as unknown as TPjsApi
    vi.spyOn(ApiPromise, 'create').mockResolvedValue(mockApiPromise)
    polkadotApi = new PolkadotJsApi(mockApiPromise)
    await polkadotApi.init(mockChain)

    vi.mocked(findNativeAssetInfoOrThrow).mockReset()
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
      symbol: 'DOT',
      decimals: 10,
      location: {
        parents: 0,
        interior: {
          Here: null
        }
      }
    } as TAssetInfo)

    vi.mocked(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).mockReset()
    vi.mocked(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).mockResolvedValue({
      toJSON: vi.fn().mockReturnValue({
        ok: {
          refTime: '0',
          proofSize: '0'
        }
      })
    } as unknown as Codec)

    vi.mocked(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).mockReset()
    vi.mocked(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).mockResolvedValue({
      toJSON: vi.fn().mockReturnValue({ ok: 0 })
    } as unknown as Codec)

    vi.mocked(mockApiPromise.call.xcmPaymentApi.queryDeliveryFees).mockReset()
    vi.mocked(mockApiPromise.call.xcmPaymentApi.queryDeliveryFees).mockResolvedValue({
      toJSON: vi.fn().mockReturnValue({ ok: { v4: [] } })
    } as unknown as Codec)

    accountCurrencyMapMock = mockApiPromise.query.multiTransactionPayment
      .accountCurrencyMap as unknown as Mock
    accountCurrencyMapMock.mockReset()
    vi.mocked(findAssetInfoOrThrow).mockReset()
  })

  describe('getFromRpc', () => {
    it('throws UnsupportedOperationError when module or method is missing', async () => {
      const polkadotApi = new PolkadotJsApi({
        ...mockApiPromise,
        rpc: { state: {} }
      } as unknown as TPjsApi)

      await polkadotApi.init(mockChain)

      await expect(polkadotApi.getFromRpc('state', 'getStorage', '0x01')).rejects.toThrow(
        'RPC method state.getStorage not available'
      )
    })
  })

  it('should set and get the api', async () => {
    const newApi = {
      call: {},
      tx: {},
      query: {}
    } as unknown as TPjsApi
    const polkadotApi = new PolkadotJsApi(newApi)
    expect(polkadotApi.getConfig()).toBe(newApi)
    await polkadotApi.init('Acala')
    const api = polkadotApi.getApi()
    expect(api).toBe(newApi)
  })

  describe('init', () => {
    it('should set api to _api when _api is defined', async () => {
      const mockApi = {
        call: {},
        tx: {},
        query: {}
      } as unknown as TPjsApi
      const polkadotApi = new PolkadotJsApi(mockApi)
      await polkadotApi.init('Acala')
      expect(polkadotApi.getApi()).toBe(mockApi)
    })

    it('should create api instance when _api is undefined', async () => {
      const polkadotApi = new PolkadotJsApi()
      const wsUrl = ['wss://acala.example']
      vi.mocked(getChainProviders).mockReturnValue(wsUrl)
      const createApiInstanceSpy = vi
        .spyOn(polkadotApi, 'createApiInstance')
        .mockResolvedValue(mockApiPromise)

      await polkadotApi.init('Acala')

      expect(createApiInstanceSpy).toHaveBeenCalledWith(wsUrl, 'Acala')
      expect(polkadotApi.getApi()).toBe(mockApiPromise)

      createApiInstanceSpy.mockRestore()
    })

    it('should return early if already initialized', async () => {
      const createApiInstanceSpy = vi.spyOn(polkadotApi, 'createApiInstance')

      await polkadotApi.init('Moonbeam')

      expect(createApiInstanceSpy).not.toHaveBeenCalled()
      expect(polkadotApi.getApi()).toBe(mockApiPromise)
      createApiInstanceSpy.mockRestore()
    })

    it('should use apiOverrides when provided in config', async () => {
      const polkadotApi = new PolkadotJsApi({
        apiOverrides: {
          Moonbeam: mockApiPromise
        }
      })
      const createApiInstanceSpy = vi.spyOn(polkadotApi, 'createApiInstance')
      await polkadotApi.init('Moonbeam')

      expect(polkadotApi.getApi()).toBe(mockApiPromise)
      expect(createApiInstanceSpy).not.toHaveBeenCalled()
      createApiInstanceSpy.mockRestore()
    })

    it('should throw MissingChainApiError in development mode when no override provided', async () => {
      polkadotApi = new PolkadotJsApi({
        development: true,
        apiOverrides: {
          Acala: mockApiPromise
          // Moonbeam not provided
        }
      })

      await expect(polkadotApi.init('Moonbeam')).rejects.toThrow(
        new MissingChainApiError('Moonbeam')
      )
    })

    it('should create api automatically when no config and no overrides', async () => {
      const polkadotApi = new PolkadotJsApi()
      const wsUrl = ['wss://auto.acala']
      vi.mocked(getChainProviders).mockReturnValue(wsUrl)
      const createApiInstanceSpy = vi
        .spyOn(polkadotApi, 'createApiInstance')
        .mockResolvedValue(mockApiPromise)

      await polkadotApi.init('Acala')

      expect(createApiInstanceSpy).toHaveBeenCalledWith(wsUrl, 'Acala')
      expect(polkadotApi.getApi()).toBe(mockApiPromise)
      createApiInstanceSpy.mockRestore()
    })
  })

  describe('accountToHex', () => {
    it('should return the hex address as hex string', () => {
      const address = '0x1234567890abcdef'

      const result = polkadotApi.accountToHex(address)

      expect(result).toBe(address)
    })

    it('should return the address as hex string without prefix', () => {
      const address = '7LgutW4uapAUb9XtHjsRmemvWmkyfukPSw1Sr5LwqqUGTKjf'
      const result = polkadotApi.accountToHex(address, false)
      expect(result).toBe('88ca48e3e1d0f1c50bd6b504e1312d21f5bd45ed147e3c30c77eb5e4d63bdc63')
    })

    it('should return the address as hex string with prefiex', () => {
      const address = '7LgutW4uapAUb9XtHjsRmemvWmkyfukPSw1Sr5LwqqUGTKjf'
      const result = polkadotApi.accountToHex(address, true)
      expect(result).toBe('0x88ca48e3e1d0f1c50bd6b504e1312d21f5bd45ed147e3c30c77eb5e4d63bdc63')
    })
  })

  describe('accountToUint8a', () => {
    it('should convert address to Uint8Array', () => {
      const address = '0x1234567890abcdef'
      const result = polkadotApi.accountToUint8a(address)
      expect(result).toBeInstanceOf(Uint8Array)
    })
  })

  describe('validateSubstrateAddress', () => {
    it('should return true when the address is valid', () => {
      const address = '5FHneW46xGXgs5mUiveU4sbTyGBzmst2oT29E5c9F7NYtiLP'
      vi.mocked(validateAddress).mockImplementation(() => {
        // validateAddress from @polkadot/util-crypto doesn't throw when valid
        return true
      })

      const result = polkadotApi.validateSubstrateAddress(address)

      expect(result).toBe(true)
      expect(validateAddress).toHaveBeenCalledWith(address)
    })

    it('should return false when validateAddress throws an error', () => {
      const address = 'invalid-address'
      vi.mocked(validateAddress).mockImplementation(() => {
        throw new Error('Invalid address')
      })

      const result = polkadotApi.validateSubstrateAddress(address)

      expect(result).toBe(false)
      expect(validateAddress).toHaveBeenCalledWith(address)
    })
  })

  describe('getMethod', () => {
    it('should return the method', () => {
      const tx = {
        method: { method: '' }
      } as unknown as Extrinsic
      const result = polkadotApi.getMethod(tx)
      expect(result).toBe(tx.method.method)
    })
  })

  describe('getTypeThenAssetCount', () => {
    it('returns the asset count when assets argument is present', () => {
      const assets = [{}, {}]
      const tx = {
        method: { method: 'transferAssetsUsingTypeAndThen' },
        toHuman: vi.fn().mockReturnValue({
          method: {
            args: {
              assets: {
                someKey: assets
              }
            }
          }
        })
      } as unknown as Extrinsic

      expect(polkadotApi.getTypeThenAssetCount(tx)).toBe(assets.length)
    })

    it('returns undefined when assets do not expose a length', () => {
      const tx = {
        method: 'transferAssetsUsingTypeAndThen',
        toHuman: vi.fn().mockReturnValue({
          method: {
            args: {
              assets: {
                someKey: { foo: 'bar' }
              }
            }
          }
        })
      } as unknown as Extrinsic

      expect(polkadotApi.getTypeThenAssetCount(tx)).toBeUndefined()
    })
  })

  describe('deserializeExtrinsics', () => {
    it('should create an extrinsic with the provided module, method, and parameters', () => {
      const serializedCall: TSerializedExtrinsics = {
        module: 'XTokens',
        method: 'transfer',
        params: { beneficiary: 'recipient_address', amount: 1000 }
      }

      const result = polkadotApi.deserializeExtrinsics(serializedCall)

      expect(mockApiPromise.tx.xTokens.transfer).toHaveBeenCalledWith('recipient_address', 1000)
      expect(result).toBe('mocked_extrinsic')
    })
  })

  describe('callDispatchAsMethod', () => {
    it('should create a dispatchAs extrinsic with the provided inner and address', () => {
      const tx = '' as unknown as Extrinsic
      const address = 'recipient_address'

      const result = polkadotApi.callDispatchAsMethod(tx, address)

      expect(mockApiPromise.tx.utility.dispatchAs).toHaveBeenCalledWith(
        {
          system: {
            Signed: address
          }
        },
        tx
      )
      expect(result).toBe('mocked_utility_extrinsic')
    })
  })

  describe('callBatchMethod', () => {
    it('should create a batch extrinsic with the provided calls and BATCH mode', () => {
      const calls = ['call1', 'call2'] as unknown as Extrinsic[]
      const mode = BatchMode.BATCH

      const result = polkadotApi.callBatchMethod(calls, mode)

      expect(mockApiPromise.tx.utility.batch).toHaveBeenCalledWith(calls)
      expect(result).toBe('mocked_utility_extrinsic')
    })

    it('should create a batch_all extrinsic with the provided calls and BATCH_ALL mode', () => {
      const calls = ['call1', 'call2'] as unknown as Extrinsic[]
      const mode = BatchMode.BATCH_ALL

      const result = polkadotApi.callBatchMethod(calls, mode)

      expect(mockApiPromise.tx.utility.batchAll).toHaveBeenCalledWith(calls)
      expect(result).toBe('mocked_utility_extrinsic')
    })
  })

  describe('calculateTransactionFee', () => {
    it('should return the partial fee as bigint', async () => {
      const mockExtrinsic = {
        paymentInfo: vi.fn().mockResolvedValue({ partialFee: { toBigInt: () => 1000n } })
      } as unknown as Extrinsic
      const address = 'some_address'

      const spy = vi.spyOn(mockExtrinsic, 'paymentInfo')

      const fee = await polkadotApi.calculateTransactionFee(mockExtrinsic, address)

      expect(spy).toHaveBeenCalledWith(address)
      expect(fee).toBe(1000n)
    })
  })

  describe('getEvmStorage', () => {
    it('should return the EVM storage value as bigint', async () => {
      const address = 'some_address'
      const key = 'some_key'

      const result = await polkadotApi.getEvmStorage(address, key)

      expect(mockApiPromise.query.evm.accountStorages.key).toHaveBeenCalledWith(address, key)
      expect(result).toBe('0x1234567890abcdef')
    })
  })

  describe('clone', () => {
    it('should return a new instance of PolkadotJsApi', () => {
      const cloneApi = polkadotApi.clone()
      expect(cloneApi).toBeInstanceOf(PolkadotJsApi)
      expect(cloneApi).not.toBe(polkadotApi)
    })
  })

  describe('getFromStorage', () => {
    it('should return the value as hex string', async () => {
      const key = 'some'
      const mockResponse = {
        toHex: vi.fn().mockReturnValue('0x1234567890abcdef')
      } as unknown as VoidFn

      vi.mocked(mockApiPromise.rpc.state.getStorage).mockResolvedValue(mockResponse)

      const result = await polkadotApi.getFromRpc('state', 'getStorage', key)

      expect(mockApiPromise.rpc.state.getStorage).toHaveBeenCalledWith(key)

      expect(result).toBe('0x1234567890abcdef')
    })
  })

  describe('hasMethod', () => {
    it('resolves true when method exists and false otherwise', async () => {
      await expect(polkadotApi.hasMethod('XTokens', 'transfer')).resolves.toBe(true)
      await expect(
        polkadotApi.hasMethod('PolkadotXcm', 'transfer_assets_using_type_and_then')
      ).resolves.toBe(false)
      await expect(polkadotApi.hasMethod('PolkadotXcm', 'foo')).resolves.toBe(false)
    })
  })

  describe('getXcmPaymentApiFee', () => {
    it('should return the XCM payment fee for AssetHub chains', async () => {
      const xcm = { some: 'xcm_payload' }
      const forwardedXcm: unknown[] = []
      const asset: TAssetInfo = {
        symbol: 'DOT',
        decimals: 10,
        location: {
          parents: 1,
          interior: {
            X1: {
              Parachain: 1000
            }
          }
        }
      }

      const weight = {
        refTime: 1000,
        proofSize: 2000
      }

      const mockWeight = {
        toJSON: vi.fn().mockReturnValue({ ok: weight })
      }

      const mockFeeResult = {
        toJSON: vi.fn().mockReturnValue({ ok: 5000 })
      }

      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).mockResolvedValue(mockWeight)
      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).mockResolvedValue(
        mockFeeResult
      )

      const fee = await polkadotApi.getXcmPaymentApiFee(
        'AssetHubPolkadot',
        xcm,
        forwardedXcm,
        asset
      )

      expect(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).toHaveBeenCalledWith(xcm)
      expect(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).toHaveBeenCalledWith(
        weight,
        expect.objectContaining({
          V4: expect.any(Object)
        })
      )
      expect(fee).toBe(5000n)
    })

    it('should return the XCM payment fee for regular chains', async () => {
      const xcm = { some: 'xcm_payload' }
      const forwardedXcm: unknown[] = []
      const asset: TAssetInfo = {
        symbol: 'KSM',
        decimals: 12,
        location: {
          parents: 0,
          interior: {
            Here: null
          }
        }
      }

      const weight = {
        refTime: '2000',
        proofSize: '3000'
      }

      const mockWeight = {
        toJSON: vi.fn().mockReturnValue({ ok: weight })
      }

      const mockFeeResult = {
        toJSON: vi.fn().mockReturnValue({ ok: 10000 })
      }

      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).mockResolvedValue(mockWeight)
      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).mockResolvedValue(
        mockFeeResult
      )

      const fee = await polkadotApi.getXcmPaymentApiFee('Acala', xcm, forwardedXcm, asset)

      expect(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).toHaveBeenCalledWith(xcm)
      expect(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).toHaveBeenCalledWith(
        weight,
        expect.objectContaining({ V4: expect.any(Object) })
      )
      expect(fee).toBe(10000n)
    })

    it('should throw error when asset has no location', async () => {
      const xcm = { some: 'xcm_payload' }
      const asset = {
        symbol: 'DOT'
        // No location
      } as TAssetInfo

      await expect(
        polkadotApi.getXcmPaymentApiFee('AssetHubPolkadot', xcm, [], asset)
      ).rejects.toThrow()
    })

    it('should handle relaychains', async () => {
      const xcm = { some: 'xcm_payload' }
      const forwardedXcm: unknown[] = []
      const asset: TAssetInfo = {
        symbol: 'DOT',
        decimals: 10,
        location: {
          parents: 0,
          interior: {
            X1: {
              Parachain: 2000
            }
          }
        }
      }

      const weight = {
        refTime: 1500,
        proofSize: 2500
      }

      const mockWeight = {
        toJSON: vi.fn().mockReturnValue({ ok: weight })
      }

      const mockFeeResult = {
        toJSON: vi.fn().mockReturnValue({ ok: 7500 })
      }

      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).mockResolvedValue(mockWeight)
      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).mockResolvedValue(
        mockFeeResult
      )

      const fee = await polkadotApi.getXcmPaymentApiFee('Polkadot', xcm, forwardedXcm, asset)

      expect(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).toHaveBeenCalledWith(xcm)
      expect(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).toHaveBeenCalledWith(
        weight,
        expect.objectContaining({
          V4: expect.any(Object)
        })
      )
      expect(fee).toBe(7500n)
    })

    it('should handle AssetHubKusama chain', async () => {
      const xcm = { some: 'xcm_payload' }
      const forwardedXcm: unknown[] = []
      const asset: TAssetInfo = {
        symbol: 'KSM',
        decimals: 12,
        location: {
          parents: 1,
          interior: {
            X1: {
              Parachain: 1000
            }
          }
        }
      }

      const weight = { refTime: 3000, proofSize: 4000 }

      const mockWeight = {
        toJSON: vi.fn().mockReturnValue({ ok: weight })
      }

      const mockFeeResult = {
        toJSON: vi.fn().mockReturnValue({ ok: 15000 })
      }

      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).mockResolvedValue(mockWeight)
      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).mockResolvedValue(
        mockFeeResult
      )

      const fee = await polkadotApi.getXcmPaymentApiFee('AssetHubKusama', xcm, forwardedXcm, asset)

      expect(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).toHaveBeenCalledWith(xcm)
      expect(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).toHaveBeenCalledWith(
        weight,
        expect.objectContaining({
          V4: expect.any(Object)
        })
      )
      expect(fee).toBe(15001n)
    })

    it('should handle Kusama relay chain', async () => {
      const xcm = { some: 'xcm_payload' }
      const forwardedXcm: unknown[] = []
      const asset: TAssetInfo = {
        symbol: 'KSM',
        decimals: 12,
        location: {
          parents: 0,
          interior: {
            Here: null
          }
        }
      }

      const weight = { refTime: 2500, proofSize: 3500 }

      const mockWeight = {
        toJSON: vi.fn().mockReturnValue({ ok: weight })
      }

      const mockFeeResult = {
        toJSON: vi.fn().mockReturnValue({ ok: 12500 })
      }

      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).mockResolvedValue(mockWeight)
      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).mockResolvedValue(
        mockFeeResult
      )

      const fee = await polkadotApi.getXcmPaymentApiFee('Kusama', xcm, forwardedXcm, asset)

      expect(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).toHaveBeenCalledWith(xcm)
      expect(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).toHaveBeenCalledWith(
        weight,
        expect.objectContaining({
          V4: expect.any(Object)
        })
      )
      expect(fee).toBe(12500n)
    })

    it('uses BridgeHub fallback when AssetNotFound occurs', async () => {
      const xcm = { some: 'xcm_payload' }
      const forwardedXcm: unknown[] = []
      const asset: TAssetInfo = {
        symbol: 'DOT',
        decimals: 10,
        location: {
          parents: 1,
          interior: {
            X2: [{ GlobalConsensus: { polkadot: null } }, { Parachain: 1000 }]
          }
        }
      }

      const weight = { refTime: 1234, proofSize: 5678 }

      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).mockResolvedValue({
        toJSON: vi.fn().mockReturnValue({ ok: weight })
      } as unknown as Codec)

      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).mockResolvedValue({
        toJSON: vi.fn().mockReturnValue({ err: 'AssetNotFound' })
      } as unknown as Codec)

      const fallbackSpy = vi
        .spyOn(polkadotApi, 'getBridgeHubFallbackExecFee')
        .mockResolvedValueOnce(9999n)

      const fee = await polkadotApi.getXcmPaymentApiFee(
        'BridgeHubPolkadot',
        xcm,
        forwardedXcm,
        asset
      )

      expect(fallbackSpy).toHaveBeenCalledWith('BridgeHubPolkadot', weight, asset)
      expect(fee).toBe(9999n)
    })

    it('returns zero when BridgeHub fallback is unavailable', async () => {
      const xcm = { some: 'xcm_payload' }
      const forwardedXcm: unknown[] = []
      const asset: TAssetInfo = {
        symbol: 'DOT',
        decimals: 10,
        location: {
          parents: 1,
          interior: {
            X1: [{ Parachain: 1000 }]
          }
        }
      }

      const weight = { refTime: 11, proofSize: 22 }

      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).mockResolvedValue({
        toJSON: vi.fn().mockReturnValue({ ok: weight })
      } as unknown as Codec)

      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).mockResolvedValue({
        toJSON: vi.fn().mockReturnValue({ err: 'AssetNotFound' })
      } as unknown as Codec)

      const fallbackSpy = vi
        .spyOn(polkadotApi, 'getBridgeHubFallbackExecFee')
        .mockResolvedValueOnce(undefined)

      const fee = await polkadotApi.getXcmPaymentApiFee(
        'BridgeHubPolkadot',
        xcm,
        forwardedXcm,
        asset
      )

      expect(fallbackSpy).toHaveBeenCalledWith('BridgeHubPolkadot', weight, asset)
      expect(fee).toBe(0n)
    })
  })

  describe('getBridgeHubFallbackExecFee', () => {
    const chain = 'BridgeHubPolkadot'
    const weightValue = { refTime: 11, proofSize: 22 }
    const asset: TAssetInfo = {
      symbol: 'DOT',
      decimals: 10,
      location: {
        parents: 1,
        interior: { X1: [{ Parachain: 1000 }] }
      } as TLocation
    }

    it('converts relay fee via AssetHub and returns bigint', async () => {
      const fallbackFee = 777
      const convertedFee = 999n
      const localizedLoc = { parents: 0, interior: { Here: null } } as TLocation

      vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
      vi.mocked(localizeLocation).mockReturnValue(localizedLoc)
      vi.mocked(addXcmVersionHeader).mockReturnValue({ V4: { relay: true } })

      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).mockResolvedValueOnce({
        toJSON: vi.fn().mockReturnValue({ ok: fallbackFee })
      } as unknown as Codec)

      const ahApiMock = new PolkadotJsApi(mockApiPromise)
      const initSpy = vi.spyOn(ahApiMock, 'init').mockResolvedValue(undefined)
      const quoteSpy = vi.spyOn(ahApiMock, 'quoteAhPrice').mockResolvedValue(convertedFee)

      const cloneSpy = vi.spyOn(polkadotApi, 'clone').mockReturnValue(ahApiMock)

      const res = await polkadotApi.getBridgeHubFallbackExecFee(chain, weightValue, asset)

      expect(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).toHaveBeenCalledWith(
        weightValue,
        { V4: { relay: true } }
      )
      expect(addXcmVersionHeader).toHaveBeenCalledWith(RELAY_LOCATION, Version.V4)
      expect(cloneSpy).toHaveBeenCalledTimes(1)
      expect(initSpy).toHaveBeenCalledWith('AssetHubPolkadot')
      expect(localizeLocation).toHaveBeenCalledWith('AssetHubPolkadot', asset.location)
      expect(quoteSpy).toHaveBeenCalledWith(
        RELAY_LOCATION,
        localizedLoc,
        BigInt(fallbackFee),
        false
      )
      expect(res).toBe(convertedFee)
    })

    it('returns undefined when fallback fee or conversion is unavailable', async () => {
      vi.mocked(addXcmVersionHeader).mockReturnValue({ V4: {} })
      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).mockResolvedValueOnce({
        toJSON: vi.fn().mockReturnValue({ ok: undefined })
      } as unknown as Codec)

      const resWithoutFee = await polkadotApi.getBridgeHubFallbackExecFee(chain, weightValue, asset)
      expect(resWithoutFee).toBeUndefined()

      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).mockResolvedValueOnce({
        toJSON: vi.fn().mockReturnValue({ ok: 123 })
      } as unknown as Codec)

      const ahApiMock = {
        init: vi.fn().mockResolvedValue(undefined),
        quoteAhPrice: vi.fn().mockResolvedValue(undefined)
      } as unknown as PolkadotJsApi

      vi.spyOn(polkadotApi, 'clone').mockReturnValue(ahApiMock)

      const resWithoutConversion = await polkadotApi.getBridgeHubFallbackExecFee(
        chain,
        weightValue,
        asset
      )

      expect(resWithoutConversion).toBeUndefined()
    })
  })

  describe('createApiForChain', () => {
    it('should create a new PolkadotJsApi instance and call init with the provided chain', async () => {
      const chain = 'Acala'
      const wsUrl = ['wss://create.acala']
      vi.mocked(getChainProviders).mockReturnValue(wsUrl)
      const createApiInstanceSpy = vi
        .spyOn(PolkadotJsApi.prototype, 'createApiInstance')
        .mockResolvedValue(mockApiPromise)

      const newApi = await polkadotApi.createApiForChain(chain)

      expect(newApi).toBeInstanceOf(PolkadotJsApi)
      expect(newApi.getApi()).toBe(mockApiPromise)

      createApiInstanceSpy.mockRestore()
    })
  })

  describe('disconnect', () => {
    it('should disconnect the api when _api is a string', async () => {
      const mockDisconnect = vi.spyOn(mockApiPromise, 'disconnect').mockResolvedValue()

      polkadotApi = new PolkadotJsApi('api')
      await polkadotApi.init(mockChain)
      await polkadotApi.disconnect()

      expect(mockDisconnect).toHaveBeenCalled()

      mockDisconnect.mockRestore()
    })

    it('should disconnect the api when _api is not provided', async () => {
      const wsUrl = ['wss://disconnect.acala']
      vi.mocked(getChainProviders).mockReturnValue(wsUrl)
      const createApiInstanceSpy = vi
        .spyOn(PolkadotJsApi.prototype, 'createApiInstance')
        .mockResolvedValue(mockApiPromise)

      const mockDisconnect = vi.spyOn(mockApiPromise, 'disconnect')

      polkadotApi = new PolkadotJsApi()
      await polkadotApi.init(mockChain)
      await polkadotApi.disconnect()

      expect(mockDisconnect).toHaveBeenCalled()

      createApiInstanceSpy.mockRestore()
      mockDisconnect.mockRestore()
    })

    it('should not disconnect the api when _api is provided', async () => {
      const mockDisconnect = vi.spyOn(mockApiPromise, 'disconnect').mockResolvedValue()

      polkadotApi = new PolkadotJsApi(mockApiPromise)
      await polkadotApi.disconnect()

      expect(mockDisconnect).not.toHaveBeenCalled()

      mockDisconnect.mockRestore()
    })

    it('should disconnect the api when force is true', async () => {
      const mockDisconnect = vi.spyOn(mockApiPromise, 'disconnect').mockResolvedValue()

      polkadotApi = new PolkadotJsApi('api')
      await polkadotApi.init(mockChain)
      await polkadotApi.disconnect(true)

      expect(mockDisconnect).toHaveBeenCalled()

      mockDisconnect.mockRestore()
    })

    it('should not disconnect the api when force is false and disconnectAllowed is false', async () => {
      const mockDisconnect = vi.spyOn(mockApiPromise, 'disconnect').mockResolvedValue()

      polkadotApi = new PolkadotJsApi('api')
      polkadotApi.setDisconnectAllowed(false)
      await polkadotApi.disconnect(false)

      expect(mockDisconnect).not.toHaveBeenCalled()

      mockDisconnect.mockRestore()
    })
  })

  describe('getDryRunCall', () => {
    const address = 'some_address'
    const chain = 'Astar'
    let mockExtrinsic: Extrinsic

    const hereForwarded = [
      [
        {
          v4: { parents: 0, interior: { Here: null } }
        }
      ]
    ] as unknown as object[]

    const x1ArrayForwarded = [
      [
        {
          v4: {
            parents: 1,
            interior: { x1: [{ parachain: 2001 }] }
          }
        }
      ]
    ] as unknown as object[]

    const makeSuccessResponse = (opts?: {
      weight?: { refTime: string; proofSize: string }
      forwarded?: object[]
    }): Codec =>
      ({
        toHuman: vi.fn().mockReturnValue({
          Ok: { executionResult: { Ok: true } }
        }),
        toJSON: vi.fn().mockReturnValue({
          ok: {
            executionResult: {
              ok: opts?.weight ? { actualWeight: opts.weight } : {}
            },
            forwardedXcms: opts?.forwarded ?? []
          }
        })
      }) as unknown as Codec

    const makeErrOtherResponse = (reason = 'SomeOtherReason'): Codec =>
      ({
        toHuman: vi.fn().mockReturnValue({
          Ok: { executionResult: { Err: { error: { Other: reason } } } }
        }),
        toJSON: vi.fn().mockReturnValue({
          ok: {
            executionResult: { err: { error: { other: reason } } },
            forwardedXcms: []
          }
        })
      }) as unknown as Codec

    const makeErrModuleResponse = (): Codec =>
      ({
        toHuman: vi.fn().mockReturnValue({
          Ok: { executionResult: { Err: { error: { Module: 'ModuleError' } } } }
        }),
        toJSON: vi.fn().mockReturnValue({
          ok: {
            executionResult: { err: { error: { Module: 'ModuleError' } } },
            forwardedXcms: []
          }
        })
      }) as unknown as Codec

    const makeJsonModuleOnlyResponse = (): Codec =>
      ({
        toHuman: vi.fn().mockReturnValue({}),
        toJSON: vi.fn().mockReturnValue({
          ok: {
            executionResult: { err: { error: { module: { index: 1, error: 2 } } } },
            forwardedXcms: []
          }
        })
      }) as unknown as Codec

    const makeJsonOtherOnlyResponse = (reason: unknown = 'JsonOnlyFailure'): Codec =>
      ({
        toHuman: vi.fn().mockReturnValue({}),
        toJSON: vi.fn().mockReturnValue({
          ok: {
            executionResult: { err: { error: { other: reason } } },
            forwardedXcms: []
          }
        })
      }) as unknown as Codec

    const makeNoErrShapesResponse = (): Codec =>
      ({
        toHuman: vi.fn().mockReturnValue({}),
        toJSON: vi.fn().mockReturnValue(undefined)
      }) as unknown as Codec

    beforeEach(() => {
      mockExtrinsic = {
        paymentInfo: vi.fn().mockResolvedValue({ partialFee: { toBigInt: () => 1000n } })
      } as unknown as Extrinsic
      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mockReset()
      vi.mocked(wrapTxBypass).mockReset()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('simple success (no version), returns weight and forwardedXcms', async () => {
      const resp = makeSuccessResponse({
        weight: { refTime: '1000', proofSize: '2000' },
        forwarded: hereForwarded
      })
      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mockResolvedValue(resp)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'DOT'
      } as TAssetInfo)

      const result = await polkadotApi.getDryRunCall({
        tx: mockExtrinsic,
        address,
        chain,
        destination: 'Hydration',
        asset: { symbol: 'DOT' } as WithAmount<TAssetInfo>
      })

      expect(mockApiPromise.call.dryRunApi.dryRunCall).toHaveBeenCalledTimes(1)
      expect(mockApiPromise.call.dryRunApi.dryRunCall).toHaveBeenCalledWith(
        { system: { Signed: address } },
        mockExtrinsic
      )
      expect(result).toEqual({
        success: true,
        fee: 1000n,
        asset: { symbol: 'DOT' } as TAssetInfo,
        weight: { refTime: 1000n, proofSize: 2000n },
        forwardedXcms: expect.any(Object),
        destParaId: undefined
      })
    })

    it('uses tx.paymentInfo weight override when local_xcm is missing and fee asset is custom', async () => {
      const resp = makeSuccessResponse({
        weight: { refTime: '1', proofSize: '2' },
        forwarded: []
      })

      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mockResolvedValue(resp)

      const overriddenWeight = { refTime: 123, proofSize: 456 }
      const extrinsicWithPaymentInfo = {
        paymentInfo: vi.fn().mockResolvedValue({
          partialFee: { toBigInt: () => 1000n },
          weight: overriddenWeight
        })
      }
      const paymentInfoSpy = vi.spyOn(extrinsicWithPaymentInfo, 'paymentInfo')
      const tx = extrinsicWithPaymentInfo as unknown as Extrinsic

      const customAsset: TAssetInfo = {
        symbol: 'USDC',
        decimals: 6,
        location: {
          parents: 0,
          interior: { Here: null }
        }
      }

      vi.spyOn(polkadotApi, 'resolveFeeAsset').mockResolvedValue({
        asset: customAsset,
        isCustomAsset: true
      })

      const getXcmPaymentApiFeeSpy = vi
        .spyOn(polkadotApi, 'getXcmPaymentApiFee')
        .mockResolvedValue(999n)

      const result = await polkadotApi.getDryRunCall({
        tx,
        address,
        chain,
        destination: 'Acala',
        asset: customAsset as unknown as WithAmount<TAssetInfo>
      })

      expect(paymentInfoSpy).toHaveBeenCalledWith(address)
      expect(getXcmPaymentApiFeeSpy).toHaveBeenCalledWith(
        chain,
        undefined,
        [],
        customAsset,
        false,
        overriddenWeight
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

    it('success with undefined weight and no forwardedXcms', async () => {
      const resp = makeSuccessResponse()
      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mockResolvedValue(resp)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'DOT'
      } as TAssetInfo)

      const result = await polkadotApi.getDryRunCall({
        tx: mockExtrinsic,
        address,
        chain,
        destination: 'Hydration',
        asset: { symbol: 'DOT' } as WithAmount<TAssetInfo>
      })

      expect(mockApiPromise.call.dryRunApi.dryRunCall).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        success: true,
        fee: 1000n,
        asset: { symbol: 'DOT' } as TAssetInfo,
        weight: undefined,
        forwardedXcms: [],
        destParaId: undefined
      })
    })

    it('returns failure with "Other" error without retry', async () => {
      const resp = makeErrOtherResponse()
      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mockResolvedValue(resp)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await polkadotApi.getDryRunCall({
        tx: mockExtrinsic,
        address,
        chain,
        destination: 'Hydration',
        asset: { symbol: 'DOT' } as WithAmount<TAssetInfo>
      })

      expect(mockApiPromise.call.dryRunApi.dryRunCall).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        success: false,
        failureReason: 'SomeOtherReason',
        asset: { symbol: 'GLMR' } as TAssetInfo
      })
    })

    it('JSON-only module error (no human error present)', async () => {
      const resp = makeJsonModuleOnlyResponse()
      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mockResolvedValue(resp)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await polkadotApi.getDryRunCall({
        tx: mockExtrinsic,
        address,
        chain,
        destination: 'Hydration',
        asset: { symbol: 'DOT' } as WithAmount<TAssetInfo>
      })

      expect(result).toEqual({
        success: false,
        failureReason: 'ModuleError',
        asset: { symbol: 'GLMR' } as TAssetInfo
      })
    })

    it('returns failure reason from JSON other when human result has no error', async () => {
      const resp = makeJsonOtherOnlyResponse('JsonOnlyFailureReason')
      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mockResolvedValue(resp)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await polkadotApi.getDryRunCall({
        tx: mockExtrinsic,
        address,
        chain,
        destination: 'Hydration',
        asset: { symbol: 'DOT' } as WithAmount<TAssetInfo>
      })

      expect(result).toEqual({
        success: false,
        failureReason: 'JsonOnlyFailureReason',
        asset: { symbol: 'GLMR' } as TAssetInfo
      })
    })

    it('falls back to stringified output when neither human nor JSON have recognizable error', async () => {
      const resp = makeNoErrShapesResponse()
      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mockResolvedValue(resp)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await polkadotApi.getDryRunCall({
        tx: mockExtrinsic,
        address,
        chain,
        destination: 'Hydration',
        asset: { symbol: 'DOT' } as WithAmount<TAssetInfo>
      })

      expect(result).toEqual({
        success: false,
        failureReason: '{}',
        asset: { symbol: 'GLMR' } as TAssetInfo
      })
    })

    it('retries after VersionedConversionFailed and succeeds on the second attempt (with version)', async () => {
      const vcf = makeErrOtherResponse('VersionedConversionFailed')
      const ok = makeSuccessResponse({
        weight: { refTime: '123', proofSize: '456' },
        forwarded: []
      })

      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall)
        .mockResolvedValueOnce(vcf)
        .mockResolvedValueOnce(ok)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await polkadotApi.getDryRunCall({
        tx: mockExtrinsic,
        address,
        chain,
        destination: 'Hydration',
        asset: { symbol: 'DOT' } as WithAmount<TAssetInfo>
      })

      expect(vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mock.calls[0].length).toBe(2)
      expect(vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mock.calls[1][2]).toBe(3)

      expect(result).toEqual({
        success: true,
        fee: 1000n,
        asset: { symbol: 'GLMR' } as TAssetInfo,
        weight: { refTime: 123n, proofSize: 456n },
        forwardedXcms: [],
        destParaId: undefined
      })
    })

    it('returns fee from XCM payment API when supported and feeAsset provided', async () => {
      const forwarded = hereForwarded
      const expectedForwarded = forwarded[0] as object[]
      const resp = {
        toHuman: vi.fn().mockReturnValue({
          Ok: { executionResult: { Ok: true } }
        }),
        toJSON: vi.fn().mockReturnValue({
          ok: {
            executionResult: {
              ok: {
                actualWeight: { refTime: '555', proofSize: '666' }
              }
            },
            local_xcm: { instructions: [] },
            forwardedXcms: forwarded
          }
        })
      } as unknown as Codec

      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mockResolvedValue(resp)

      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'DOT',
        location: {
          parents: 0,
          interior: {
            Here: null
          }
        },
        decimals: 10
      } as TAssetInfo)

      const feeAsset: TAssetInfo = {
        symbol: 'USDT',
        decimals: 6,
        location: {
          parents: 1,
          interior: {
            X1: {
              Parachain: 2000
            }
          }
        }
      }

      const xcmFee = 7777n
      const xcmFeeSpy = vi.spyOn(polkadotApi, 'getXcmPaymentApiFee').mockResolvedValueOnce(xcmFee)
      const paymentInfoSpy = vi.spyOn(mockExtrinsic, 'paymentInfo')

      const result = await polkadotApi.getDryRunCall({
        tx: mockExtrinsic,
        address,
        chain,
        destination: 'Hydration',
        feeAsset,
        asset: { symbol: 'DOT' } as WithAmount<TAssetInfo>
      })

      expect(xcmFeeSpy).toHaveBeenCalledWith(
        chain,
        { instructions: [] },
        expectedForwarded,
        feeAsset,
        false,
        undefined
      )
      expect(paymentInfoSpy).not.toHaveBeenCalled()
      expect(result).toEqual({
        success: true,
        fee: xcmFee,
        asset: feeAsset,
        weight: { refTime: 555n, proofSize: 666n },
        forwardedXcms: expectedForwarded,
        destParaId: undefined
      })

      paymentInfoSpy.mockRestore()
      xcmFeeSpy.mockRestore()
    })

    it('wraps the transaction when useRootOrigin is enabled', async () => {
      const wrappedExtrinsic = {
        paymentInfo: vi.fn().mockResolvedValue({ partialFee: { toBigInt: () => 2000n } })
      } as unknown as Extrinsic

      vi.mocked(wrapTxBypass).mockResolvedValueOnce(wrappedExtrinsic)

      const resp = makeSuccessResponse()
      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mockResolvedValue(resp)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'DOT'
      } as TAssetInfo)

      const bypassOptions = { mintFeeAssets: true }

      const result = await polkadotApi.getDryRunCall({
        tx: mockExtrinsic,
        address,
        chain,
        destination: 'Hydration',
        useRootOrigin: true,
        bypassOptions,
        asset: { symbol: 'DOT' } as WithAmount<TAssetInfo>
      })

      expect(wrapTxBypass).toHaveBeenCalledWith(
        expect.objectContaining({
          tx: mockExtrinsic,
          api: polkadotApi
        }),
        bypassOptions
      )
      expect(mockApiPromise.call.dryRunApi.dryRunCall).toHaveBeenCalledWith(
        { system: { Root: null } },
        wrappedExtrinsic
      )
      expect(result.success).toBe(true)
    })

    it('retries after VersionedConversionFailed and returns failure when second attempt also fails', async () => {
      const vcf = makeErrOtherResponse('VersionedConversionFailed')
      const modErr = makeErrModuleResponse()

      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall)
        .mockResolvedValueOnce(vcf)
        .mockResolvedValueOnce(modErr)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await polkadotApi.getDryRunCall({
        tx: mockExtrinsic,
        address,
        chain,
        destination: 'Hydration',
        asset: { symbol: 'DOT' } as WithAmount<TAssetInfo>
      })

      expect(mockApiPromise.call.dryRunApi.dryRunCall).toHaveBeenCalledTimes(2)
      expect(result).toEqual({
        success: false,
        failureReason: 'ModuleError',
        asset: { symbol: 'GLMR' } as TAssetInfo
      })
    })

    it('returns failure with preserved reason when retry with version throws', async () => {
      const firstAttempt = makeErrOtherResponse('VersionedConversionFailed')

      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall)
        .mockResolvedValueOnce(firstAttempt)
        .mockImplementationOnce(() => {
          throw new Error('RPC temporarily unavailable')
        })
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await polkadotApi.getDryRunCall({
        tx: mockExtrinsic,
        address,
        chain,
        destination: 'Hydration',
        asset: { symbol: 'DOT' } as WithAmount<TAssetInfo>
      })

      expect(mockApiPromise.call.dryRunApi.dryRunCall).toHaveBeenCalledTimes(2)
      expect(mockApiPromise.call.dryRunApi.dryRunCall).toHaveBeenNthCalledWith(
        2,
        { system: { Signed: address } },
        mockExtrinsic,
        3
      )
      expect(result).toEqual({
        success: false,
        failureReason: 'VersionedConversionFailed',
        failureSubReason: undefined,
        asset: { symbol: 'GLMR' } as TAssetInfo
      })
    })

    it('retries with version when first call throws "Expected 3 arguments" and then succeeds', async () => {
      const ok = makeSuccessResponse({
        weight: { refTime: '1000', proofSize: '2000' },
        forwarded: hereForwarded
      })

      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall)
        .mockImplementationOnce(() => {
          throw new Error('DryRunApi_dry_run_call:: Expected 3 arguments, found 2')
        })
        .mockResolvedValueOnce(ok)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await polkadotApi.getDryRunCall({
        tx: mockExtrinsic,
        address,
        chain,
        destination: 'Hydration',
        asset: { symbol: 'DOT' } as WithAmount<TAssetInfo>
      })

      expect(mockApiPromise.call.dryRunApi.dryRunCall).toHaveBeenNthCalledWith(
        1,
        { system: { Signed: address } },
        mockExtrinsic
      )
      expect(mockApiPromise.call.dryRunApi.dryRunCall).toHaveBeenNthCalledWith(
        2,
        { system: { Signed: address } },
        mockExtrinsic,
        3
      )
      expect(result.success).toBe(true)
    })

    it('returns failure immediately when first call throws a non-arity error (no retry)', async () => {
      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mockImplementationOnce(() => {
        throw new Error('Some unexpected error')
      })
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await polkadotApi.getDryRunCall({
        tx: mockExtrinsic,
        address,
        chain,
        destination: 'Hydration',
        asset: { symbol: 'DOT' } as WithAmount<TAssetInfo>
      })

      expect(mockApiPromise.call.dryRunApi.dryRunCall).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        success: false,
        failureReason: 'Some unexpected error',
        asset: { symbol: 'GLMR' } as TAssetInfo
      })
    })

    it('extracts destParaId from forwardedXcms when interior.x1 is an array (parachain id)', async () => {
      const resp = makeSuccessResponse({
        weight: { refTime: '1', proofSize: '2' },
        forwarded: x1ArrayForwarded
      })
      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mockResolvedValue(resp)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await polkadotApi.getDryRunCall({
        tx: mockExtrinsic,
        address,
        chain,
        destination: 'Hydration',
        asset: { symbol: 'DOT' } as WithAmount<TAssetInfo>
      })

      if (result.success) expect(result.destParaId).toBe(2001)
    })

    it('prefers feeAsset metadata when provided (currency and asset fields)', async () => {
      const resp = makeSuccessResponse()
      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mockResolvedValue(resp)

      const feeAsset: TAssetInfo = { symbol: 'USDC', decimals: 6 } as unknown as TAssetInfo
      const asset: TAssetInfo = { symbol: 'DOT', decimals: 10 } as unknown as TAssetInfo

      const result = await polkadotApi.getDryRunCall({
        tx: mockExtrinsic,
        address,
        chain,
        destination: 'Hydration',
        asset: asset as WithAmount<TAssetInfo>,
        feeAsset
      })

      expect(result.asset).toEqual(feeAsset)
    })

    it('falls back to native asset when MultiTransactionPayment fee lookup fails', async () => {
      const resp = {
        toHuman: vi.fn().mockReturnValue({
          Ok: { executionResult: { Ok: true } }
        }),
        toJSON: vi.fn().mockReturnValue({
          ok: {
            executionResult: {
              ok: {
                actualWeight: { refTime: '10', proofSize: '5' }
              }
            },
            local_xcm: { instructions: [] },
            forwardedXcms: []
          }
        })
      } as unknown as Codec

      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mockResolvedValue(resp)

      const nativeAsset: TAssetInfo = {
        symbol: 'HYDR',
        location: { parents: 0, interior: { Here: null } }
      } as TAssetInfo
      const multiAsset: TAssetInfo = {
        symbol: 'USDC',
        location: { parents: 0, interior: { Here: null } }
      } as TAssetInfo

      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue(nativeAsset)

      const resolveUsedAssetSpy = vi
        .spyOn(polkadotApi, 'resolveFeeAsset')
        .mockResolvedValue({ isCustomAsset: true, asset: multiAsset })

      const getXcmPaymentApiFeeSpy = vi
        .spyOn(polkadotApi, 'getXcmPaymentApiFee')
        .mockResolvedValue(undefined as unknown as bigint)

      const result = await polkadotApi.getDryRunCall({
        tx: mockExtrinsic,
        address,
        chain: 'Hydration',
        destination: 'Moonbeam',
        asset: multiAsset as WithAmount<TAssetInfo>
      })

      expect(getXcmPaymentApiFeeSpy).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        success: true,
        fee: 1000n,
        asset: nativeAsset,
        weight: { refTime: 10n, proofSize: 5n },
        forwardedXcms: [],
        destParaId: undefined
      })

      resolveUsedAssetSpy.mockRestore()
      getXcmPaymentApiFeeSpy.mockRestore()
    })

    it('should throw error for unsupported chain', async () => {
      const mockTransaction = {} as unknown as Extrinsic

      await expect(
        polkadotApi.getDryRunCall({
          tx: mockTransaction,
          address,
          chain: 'Interlay',
          destination: 'Hydration',
          asset: {} as WithAmount<TAssetInfo>
        })
      ).rejects.toThrow(RuntimeApiUnavailableError)
    })
  })

  describe('resolveUsedAsset', () => {
    const baseOptions = {
      tx: {} as Extrinsic,
      address: 'addr',
      chain: 'Hydration' as const,
      destination: 'Moonbeam' as const,
      asset: { symbol: 'DOT' } as WithAmount<TAssetInfo>
    }

    it('returns native asset when accountCurrencyMap yields null', async () => {
      const storageResponse = {
        toJSON: vi.fn().mockReturnValue(null)
      } as unknown as Codec

      accountCurrencyMapMock.mockResolvedValue(storageResponse)

      const nativeAsset = { symbol: 'HYDR' } as TAssetInfo
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue(nativeAsset)

      const result = await polkadotApi.resolveFeeAsset(baseOptions)

      expect(accountCurrencyMapMock).toHaveBeenCalledWith(baseOptions.address)
      expect(result).toEqual({ isCustomAsset: false, asset: nativeAsset })
      expect(findAssetInfoOrThrow).not.toHaveBeenCalled()
    })

    it('returns mapped asset when accountCurrencyMap yields an id', async () => {
      const assetId = '1001'
      const storageResponse = {
        toJSON: vi.fn().mockReturnValue(assetId)
      } as unknown as Codec

      accountCurrencyMapMock.mockResolvedValue(storageResponse)

      const mappedAsset = { symbol: 'USDC' } as TAssetInfo
      vi.mocked(findAssetInfoOrThrow).mockReturnValue(mappedAsset)

      const result = await polkadotApi.resolveFeeAsset(baseOptions)

      expect(accountCurrencyMapMock).toHaveBeenCalledWith(baseOptions.address)
      expect(findAssetInfoOrThrow).toHaveBeenCalledWith('Hydration', { id: assetId }, null)
      expect(result).toEqual({ isCustomAsset: true, asset: mappedAsset })
    })
  })

  describe('getXcmWeight', () => {
    it('should return the weight from the XCM payload', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const xcm: any = []
      const mockResponse = {
        toJSON: () => ({
          ok: { refTime: '1000', proofSize: '2000' }
        })
      } as unknown as Codec

      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).mockResolvedValue(mockResponse)

      const result = await polkadotApi.getXcmWeight(xcm)

      expect(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).toHaveBeenCalledWith(xcm)
      expect(result).toEqual({ refTime: '1000', proofSize: '2000' })
    })
  })

  describe('getDryRunXcm', () => {
    const originLocation: TLocation = {
      parents: 0,
      interior: { Here: null }
    }
    const dummyXcm = { some: 'payload' }

    it('should return success with computed fee and weight', async () => {
      const mockResponse = {
        toHuman: vi.fn().mockReturnValue({
          Ok: {
            executionResult: { Complete: {} },
            emittedEvents: [
              {
                method: 'Issued',
                section: 'balances',
                data: {
                  amount: '1000'
                }
              }
            ]
          }
        }),
        toJSON: vi.fn().mockReturnValue({
          ok: {
            executionResult: {
              used: { refTime: '111', proofSize: '222' }
            },
            forwardedXcms: [
              [
                {
                  v4: {
                    parents: 0,
                    interior: { Here: null }
                  }
                }
              ]
            ]
          }
        })
      } as unknown as Codec

      vi.mocked(mockApiPromise.call.dryRunApi.dryRunXcm).mockResolvedValue(mockResponse)

      vi.mocked(computeFeeFromDryRunPjs).mockReturnValue(555n)

      const xcmPaymentSpy = vi
        .spyOn(polkadotApi, 'getXcmPaymentApiFee')
        .mockResolvedValueOnce(1000n)

      const result = await polkadotApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        asset: { symbol: 'DOT' } as TAssetInfo,
        chain: 'Astar',
        origin: 'Hydration'
      } as TDryRunXcmBaseOptions<Extrinsic>)

      xcmPaymentSpy.mockRestore()

      expect(mockApiPromise.call.dryRunApi.dryRunXcm).toHaveBeenCalledWith(originLocation, dummyXcm)
      expect(result).toEqual({
        success: true,
        fee: 1000n,
        asset: { symbol: 'DOT' } as TAssetInfo,
        weight: {
          refTime: 111n,
          proofSize: 222n
        },
        forwardedXcms: expect.any(Object)
      })
    })

    it('should return failureReason when dryRunCall is not successful', async () => {
      const mockResponse = {
        toHuman: vi.fn().mockReturnValue({
          Ok: {
            executionResult: { Incomplete: { error: 'ModuleError' } }
          }
        }),
        toJSON: vi.fn().mockReturnValue({
          ok: {
            executionResult: {
              err: { error: { Module: 'ModuleError' } }
            }
          }
        })
      } as unknown as Codec

      vi.mocked(mockApiPromise.call.dryRunApi.dryRunXcm).mockResolvedValue(mockResponse)
      vi.mocked(hasXcmPaymentApiSupport).mockReturnValueOnce(false)

      const result = await polkadotApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        asset: { symbol: 'DOT' } as TAssetInfo,
        chain: 'Astar',
        origin: 'Hydration'
      } as TDryRunXcmBaseOptions<Extrinsic>)

      expect(result).toEqual({
        success: false,
        failureReason: 'ModuleError',
        asset: { symbol: 'DOT' } as TAssetInfo
      })
    })

    it('should throw RuntimeApiUnavailableError for unsupported chain', async () => {
      await expect(
        polkadotApi.getDryRunXcm({
          originLocation,
          xcm: dummyXcm,
          chain: 'Interlay',
          origin: 'Hydration'
        } as TDryRunXcmBaseOptions<Extrinsic>)
      ).rejects.toThrow(RuntimeApiUnavailableError)
    })

    it('should throw error if no issued event found', async () => {
      const mockResponse = {
        toHuman: vi.fn().mockReturnValue({
          Ok: {
            executionResult: { Complete: {} },
            emittedEvents: []
          }
        }),
        toJSON: vi.fn().mockReturnValue({
          ok: {
            executionResult: {
              used: { refTime: '111', proofSize: '222' }
            },
            forwardedXcms: []
          }
        })
      } as unknown as Codec

      vi.mocked(mockApiPromise.call.dryRunApi.dryRunXcm).mockResolvedValue(mockResponse)
      vi.mocked(hasXcmPaymentApiSupport).mockReturnValueOnce(false)

      expect(
        await polkadotApi.getDryRunXcm({
          originLocation,
          xcm: dummyXcm,
          asset: { symbol: 'DOT' } as TAssetInfo,
          chain: 'AssetHubPolkadot',
          origin: 'Hydration'
        } as TDryRunXcmBaseOptions<Extrinsic>)
      ).toEqual({
        success: false,
        failureReason: 'Cannot determine destination fee. No Issued event found',
        asset: { symbol: 'DOT' } as TAssetInfo
      })
    })
  })

  describe('objectToHex', () => {
    it('should return the object as hex string', async () => {
      const object = { key: 'value' }
      const result = await polkadotApi.objectToHex(object, 'XcmVersionedXcm')
      expect(result).toBe('0x1234567890abcdef')
    })
  })

  describe('hexToUint8a', () => {
    it('should return the hex string as Uint8Array', () => {
      const hex = '0x1234567890abcdef'
      const result = polkadotApi.hexToUint8a(hex)
      expect(result).toBeInstanceOf(Uint8Array)
    })
  })

  describe('stringToUint8a', () => {
    it('should return the string as Uint8Array', () => {
      const str = 'some string'
      const result = polkadotApi.stringToUint8a(str)
      expect(result).toBeInstanceOf(Uint8Array)
    })
  })

  describe('blake2AsHex', () => {
    it('should return the data as hex string', () => {
      const data = new Uint8Array(8)
      const result = polkadotApi.blake2AsHex(data)
      expect(result).toBe('0x81e47a19e6b29b0a65b9591762ce5143ed30d0261e5d24a3201752506b20f15c')
    })
  })

  describe('quoteAhPrice', () => {
    it('should return the price as bigint', async () => {
      const fromMl = {
        parents: 1,
        interior: {
          X1: {
            Parachain: 1000
          }
        }
      }

      const toMl = {
        parents: 1,
        interior: {
          X1: {
            Parachain: 2000
          }
        }
      }

      const amountIn = 1000n

      const price = await polkadotApi.quoteAhPrice(fromMl, toMl, amountIn)

      expect(
        mockApiPromise.call.assetConversionApi.quotePriceExactTokensForTokens
      ).toHaveBeenCalledWith(fromMl, toMl, '1000', true)
      expect(price).toBe(1n)
    })

    it('should return undefined when quoted is null', async () => {
      const fromMl = {
        parents: 1,
        interior: {
          X1: {
            Parachain: 1000
          }
        }
      }

      const toMl = {
        parents: 1,
        interior: {
          X1: {
            Parachain: 2000
          }
        }
      }

      const amountIn = 1000n

      vi.mocked(
        mockApiPromise.call.assetConversionApi.quotePriceExactTokensForTokens
      ).mockResolvedValue({
        toJSON: vi.fn().mockReturnValue(null)
      })

      const price = await polkadotApi.quoteAhPrice(fromMl, toMl, amountIn)

      expect(
        mockApiPromise.call.assetConversionApi.quotePriceExactTokensForTokens
      ).toHaveBeenCalledWith(fromMl, toMl, '1000', true)
      expect(price).toBeUndefined()
    })
  })

  describe('getBridgeStatus', () => {
    it('should return the bridge status', async () => {
      const status = await polkadotApi.getBridgeStatus()
      expect(status).toEqual('Normal')
    })
  })
})
