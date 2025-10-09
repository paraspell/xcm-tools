import type {
  TAssetInfo,
  TChainAssetsInfo,
  TDryRunXcmBaseOptions,
  TPallet,
  WithAmount
} from '@paraspell/sdk-core'
import {
  BatchMode,
  ChainNotSupportedError,
  computeFeeFromDryRun,
  createChainClient,
  findNativeAssetInfoOrThrow,
  getAssetsObject,
  getChainProviders,
  hasXcmPaymentApiSupport,
  InvalidCurrencyError,
  InvalidParameterError,
  isAssetEqual,
  isAssetXcEqual,
  isSystemChain,
  localizeLocation,
  MissingChainApiError,
  Parents,
  type TLocation,
  type TSerializedApiCall,
  type TSubstrateChain,
  wrapTxBypass
} from '@paraspell/sdk-core'
import type { Codec, PolkadotClient, SS58String } from 'polkadot-api'
import { AccountId, Binary, createClient, FixedSizeBinary, getSs58AddressInfo } from 'polkadot-api'
import { getWsProvider } from 'polkadot-api/ws-provider'
import type { Mock } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PapiApi from './PapiApi'
import { transform } from './PapiXcmTransformer'
import type { TPapiTransaction } from './types'

vi.mock('polkadot-api/ws-provider', () => ({
  getWsProvider: vi.fn().mockReturnValue((_onMessage: (message: string) => void) => ({
    send: vi.fn(),
    disconnect: vi.fn()
  }))
}))

vi.mock('polkadot-api/polkadot-sdk-compat', () => ({
  withPolkadotSdkCompat: vi.fn().mockImplementation((provider: unknown) => provider)
}))

vi.mock('polkadot-api')

vi.mock('./PapiXcmTransformer', () => ({
  transform: vi.fn().mockReturnValue({ transformed: true })
}))

vi.mock('../utils/dryRun/computeFeeFromDryRun')

vi.mock('../utils/createChainClient', () => ({
  createChainClient: vi.fn().mockResolvedValue({} as PolkadotClient)
}))

vi.mock('@paraspell/sdk-core', async importOriginal => ({
  ...(await importOriginal()),
  computeFeeFromDryRun: vi.fn(),
  createChainClient: vi.fn().mockResolvedValue({} as PolkadotClient),
  getAssetsObject: vi.fn(),
  hasXcmPaymentApiSupport: vi.fn(),
  isAssetEqual: vi.fn(),
  getChainProviders: vi.fn(),
  wrapTxBypass: vi.fn(),
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
  const mockChain = 'Acala'

  beforeEach(async () => {
    vi.clearAllMocks()

    mockTransaction = {
      getEstimatedFees: vi.fn().mockResolvedValue(1000n),
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
              .mockResolvedValue({ value: { ref_time: 100n, proof_size: 200n } }),
            query_weight_to_asset_fee: vi.fn().mockResolvedValue({ value: 100n })
          },
          CurrenciesApi: {
            account: vi.fn().mockResolvedValue(null)
          },
          UniqueApi: {
            balance: vi.fn()
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
          EthereumOutboundQueue: {
            OperatingMode: {
              getValue: vi.fn().mockResolvedValue({ type: 'Normal' })
            }
          },
          System: {
            Account: {
              getValue: vi.fn().mockResolvedValue({
                data: {
                  free: 2000n
                }
              })
            }
          },
          Fungibles: {
            Account: {
              getValue: vi.fn()
            }
          },
          Assets: {
            Account: {
              getValue: vi.fn().mockResolvedValue({
                balance: 3000n
              })
            }
          },
          Balances: {
            Account: {
              getValue: vi.fn().mockResolvedValue({
                free: 4000n
              })
            }
          },
          ForeignAssets: {
            Account: {
              getValue: vi.fn().mockResolvedValue({
                balance: 5000n
              })
            },
            ForeignAssetToCollection: {
              getValue: vi.fn()
            }
          },
          Tokens: {
            Accounts: {
              getValue: vi.fn().mockResolvedValue({
                free: 6000n
              }),
              getEntries: vi.fn().mockResolvedValue([
                {
                  keyArgs: [
                    '',
                    {
                      toString: vi.fn().mockReturnValue('DOT')
                    }
                  ],
                  value: {
                    free: {
                      toString: vi.fn().mockReturnValue('6000')
                    }
                  }
                }
              ])
            }
          },
          OrmlTokens: {
            Accounts: {
              getEntries: vi.fn().mockResolvedValue([])
            }
          }
        }
      })
    } as unknown as PolkadotClient
    vi.mocked(createClient).mockReturnValue(mockPolkadotClient)
    vi.mocked(hasXcmPaymentApiSupport).mockReturnValue(false)
    papiApi = new PapiApi(mockPolkadotClient)
    await papiApi.init(mockChain)
  })

  it('should set config and get the api', async () => {
    papiApi = new PapiApi(mockPolkadotClient)
    expect(papiApi.getConfig()).toBe(mockPolkadotClient)
    await papiApi.init(mockChain)
    const api = papiApi.getApi()
    expect(api).toBe(mockPolkadotClient)
  })

  describe('init', () => {
    it('should set api to _api when _api is defined', async () => {
      papiApi = new PapiApi(mockPolkadotClient)
      await papiApi.init('SomeChain' as TSubstrateChain)
      expect(papiApi.getApi()).toBe(mockPolkadotClient)
    })

    it('should create api instance when _api is undefined', async () => {
      const papiApi = new PapiApi()
      const mockCreateChainClient = vi
        .mocked(createChainClient)
        .mockResolvedValue(mockPolkadotClient)

      await papiApi.init('SomeChain' as TSubstrateChain)

      expect(mockCreateChainClient).toHaveBeenCalledWith(papiApi, 'SomeChain')
      expect(papiApi.getApi()).toBe(mockPolkadotClient)

      mockCreateChainClient.mockRestore()
    })

    it('should return early if already initialized', async () => {
      papiApi = new PapiApi(mockPolkadotClient)
      await papiApi.init('Acala')

      vi.mocked(createChainClient)

      await papiApi.init('Moonbeam')

      expect(createChainClient).not.toHaveBeenCalled()
      expect(papiApi.getApi()).toBe(mockPolkadotClient)
    })

    it('should use apiOverrides when provided in config', async () => {
      const customClient = {
        ...mockPolkadotClient,
        customProp: 'custom'
      } as unknown as PolkadotClient

      papiApi = new PapiApi({
        apiOverrides: {
          Moonbeam: customClient
        }
      })

      await papiApi.init('Moonbeam')

      expect(papiApi.getApi()).toBe(customClient)
      expect(vi.mocked(createChainClient)).not.toHaveBeenCalled()
    })

    it('should throw MissingChainApiError in development mode when no override provided', async () => {
      papiApi = new PapiApi({
        development: true,
        apiOverrides: {
          Acala: mockPolkadotClient
          // Moonbeam not provided
        }
      })

      await expect(papiApi.init('Moonbeam')).rejects.toThrow(new MissingChainApiError('Moonbeam'))
    })

    it('should create api automatically when no config and no overrides', async () => {
      papiApi = new PapiApi()
      vi.mocked(createChainClient).mockResolvedValue(mockPolkadotClient)

      await papiApi.init('Acala')

      expect(createChainClient).toHaveBeenCalledWith(papiApi, 'Acala')
      expect(papiApi.getApi()).toBe(mockPolkadotClient)
    })
  })

  describe('createApiInstance', () => {
    it('should create a PolkadotClient instance', async () => {
      const wsUrl = 'ws://localhost:9944'

      const apiInstance = await papiApi.createApiInstance(wsUrl, mockChain)

      expect(apiInstance).toBe(mockPolkadotClient)
      expect(getWsProvider).toHaveBeenCalledWith(wsUrl, {})
      expect(createClient).toHaveBeenCalledOnce()
      vi.resetAllMocks()
    })
  })

  describe('convertLocationToAccount', () => {
    it('returns the address when runtime conversion succeeds', async () => {
      const convertLocationMock = vi
        .fn()
        .mockResolvedValue({ success: true, value: '5FConvertedAddress' })

      const unsafe = papiApi.getApi().getUnsafeApi()

      unsafe.apis.LocationToAccountApi.convert_location = convertLocationMock

      const location = {
        parents: Parents.ZERO,
        interior: {
          Here: null
        }
      }

      const res = await papiApi.convertLocationToAccount(location)

      expect(res).toBe('5FConvertedAddress')
      expect(convertLocationMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('callTxMethod', () => {
    it('should create a transaction with the provided module, method, and parameters', () => {
      const serializedCall: TSerializedApiCall = {
        module: 'XcmPallet',
        method: 'methodName',
        parameters: { param1: 'value1', param2: 'value2' }
      }

      const mockTxMethod = vi.fn().mockReturnValue(mockTransaction)
      const unsafeApi = papiApi.getApi().getUnsafeApi()

      unsafeApi.tx = {
        XcmPallet: {
          methodName: mockTxMethod
        }
      }

      const result = papiApi.callTxMethod(serializedCall)

      expect(result).toBe(mockTransaction)
      expect(mockTxMethod).toHaveBeenCalledOnce()
    })
  })

  describe('callDispatchAsMethod', () => {
    it('should create a dispatch call with the provided module, method, and parameters', () => {
      const mockAddress = 'some_address'
      const mockDispatchMethod = vi.fn().mockReturnValue(mockTransaction)

      const unsafeApi = papiApi.getApi().getUnsafeApi()

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
      const unsafeApi = papiApi.getApi().getUnsafeApi()
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
      const unsafeApi = papiApi.getApi().getUnsafeApi()
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
      const unsafeApi = papiApi.getApi().getUnsafeApi()
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

      const unsafeApi = papiApi.getApi().getUnsafeApi()
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

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.tx.Utility = {
        batch: vi.fn(),
        batch_all: vi.fn()
      }

      papiApi.callBatchMethod(calls, mode)

      expect(unsafeApi.tx.Utility.batch).toHaveBeenCalledOnce()
      expect(unsafeApi.tx.Utility.batch_all).not.toHaveBeenCalled()
    })
  })

  describe('calculateTransactionFee', () => {
    it('should return the estimated fee as bigint', async () => {
      const fee = await papiApi.calculateTransactionFee(mockTransaction, 'some_address')
      expect(mockTransaction.getEstimatedFees).toHaveBeenCalledWith('some_address')
      expect(fee).toBe(1000n)
    })
  })

  describe('getEvmStorage', () => {
    it('should return the EVM storage as bigint', async () => {
      vi.spyOn(FixedSizeBinary, 'fromHex').mockImplementation(
        (x: string) => x as unknown as FixedSizeBinary<32>
      )

      const unsafeApi = papiApi.getApi().getUnsafeApi()

      unsafeApi.query.EVM.AccountStorages.getKey = vi.fn().mockResolvedValue(3000n)

      const storage = await papiApi.getEvmStorage('some_address', 'some_slot')

      expect(unsafeApi.query.EVM.AccountStorages.getKey).toHaveBeenCalledWith(
        'some_address',
        'some_slot'
      )
      expect(storage).toBe(3000n)
    })
  })

  describe('getBalanceNative', () => {
    it('should return the free balance as bigint', async () => {
      papiApi = new PapiApi(mockPolkadotClient)
      await papiApi.init(mockChain)

      const balance = await papiApi.getBalanceNative('some_address')

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.System.Account.getValue).toHaveBeenCalledWith('some_address')
      expect(balance).toBe(2000n)
    })
  })

  describe('getBalanceForeignXTokens for Hydration node', () => {
    it("should return correct balance for 'a' prefixed assets", async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.apis.CurrenciesApi.account = vi.fn().mockResolvedValue({
        free: { toString: () => '2000' }
      })

      const balance = await papiApi.getBalanceForeignXTokens('Hydration', 'some_address', {
        symbol: 'aUSDC',
        assetId: '1003'
      } as TAssetInfo)

      expect(unsafeApi.apis.CurrenciesApi.account).toHaveBeenCalledWith('1003', 'some_address')
      expect(balance).toBe(2000n)
    })

    it('should return 0n when no balance is found', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.apis.CurrenciesApi.account = vi.fn().mockResolvedValue(null)

      const balance = await papiApi.getBalanceForeignXTokens('Hydration', 'some_address', {
        symbol: 'aUSDT',
        assetId: '1002'
      } as TAssetInfo)

      expect(unsafeApi.apis.CurrenciesApi.account).toHaveBeenCalledWith('1002', 'some_address')
      expect(balance).toBe(0n)
    })
  })

  describe('getBalanceForeign', () => {
    it('should return the foreign balance as bigint when balance exists', async () => {
      papiApi = new PapiApi(mockPolkadotClient)
      await papiApi.init(mockChain)
      const balance = await papiApi.getBalanceForeignPolkadotXcm(
        'AssetHubPolkadot',
        'some_address',
        { symbol: 'KSM', assetId: 'asset_id' } as TAssetInfo
      )

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.Assets.Account.getValue).toHaveBeenCalledWith(
        'asset_id',
        'some_address'
      )
      expect(balance).toBe(3000n)
    })

    it('getBalanceForeignPolkadotXcm uses Fungibles on Kilt* chains (by location)', async () => {
      papiApi = new PapiApi(mockPolkadotClient)
      await papiApi.init(mockChain)

      const unsafeApi = papiApi.getApi().getUnsafeApi()

      unsafeApi.query.Fungibles.Account.getValue = vi.fn().mockResolvedValue({ balance: 4321n })

      const loc: TLocation = { parents: 1, interior: { X1: { Parachain: 2000 } } }
      const bal = await papiApi.getBalanceForeignPolkadotXcm('KiltPaseo', 'addr', {
        symbol: 'KILT',
        location: loc
      } as TAssetInfo)

      expect(unsafeApi.query.Fungibles.Account.getValue).toHaveBeenCalledWith(
        transform(loc),
        'addr'
      )
      expect(bal).toBe(4321n)
    })

    it('getBalanceForeignPolkadotXcm uses BigInt(assetId) on NeuroWeb', async () => {
      papiApi = new PapiApi(mockPolkadotClient)
      await papiApi.init(mockChain)

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.Assets.Account.getValue = vi.fn().mockResolvedValue({ balance: 999n })

      const bal = await papiApi.getBalanceForeignPolkadotXcm('NeuroWeb', 'addr', {
        symbol: 'USDT',
        assetId: '42'
      } as TAssetInfo)

      expect(unsafeApi.query.Assets.Account.getValue).toHaveBeenCalledWith(42n, 'addr')
      expect(bal).toBe(999n)
    })

    it('should return null when balance does not exist', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.Assets.Account.getValue = vi.fn().mockResolvedValue({})

      const balance = await papiApi.getBalanceForeignPolkadotXcm('Hydration', 'some_address', {
        symbol: 'aUSDT',
        assetId: '1002'
      } as TAssetInfo)

      expect(balance).toBe(0n)
    })
  })

  describe('getMythosForeignBalance', () => {
    it('should return the Mythos foreign balance as bigint when balance exists', async () => {
      papiApi = new PapiApi(mockPolkadotClient)
      await papiApi.init(mockChain)
      const balance = await papiApi.getMythosForeignBalance('some_address')

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.Balances.Account.getValue).toHaveBeenCalledWith('some_address')
      expect(balance).toBe(4000n)
    })

    it('should return null when free balance does not exist', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.Balances.Account.getValue = vi.fn().mockResolvedValue({})

      const balance = await papiApi.getMythosForeignBalance('some_address')

      expect(balance).toEqual(0n)
    })
  })

  describe('getAssetHubForeignBalance', () => {
    const location: TLocation = {
      parents: 1,
      interior: {
        X1: {
          Parachain: 1000
        }
      }
    }

    it('should return the balance as bigint when balance exists', async () => {
      papiApi = new PapiApi(mockPolkadotClient)
      await papiApi.init(mockChain)
      const balance = await papiApi.getBalanceForeignAssetsPallet('some_address', location)

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.ForeignAssets.Account.getValue).toHaveBeenCalledWith(
        transform(location),
        'some_address'
      )
      expect(balance).toBe(5000n)
    })

    it('should return 0 when balance does not exist', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.ForeignAssets.Account.getValue = vi.fn().mockResolvedValue(undefined)

      const balance = await papiApi.getBalanceForeignAssetsPallet('some_address', location)

      expect(balance).toBe(0n)
    })
  })

  describe('getBalanceForeignBifrost', () => {
    it('should return the balance when balance exists', async () => {
      const transformedCurrencySelection = { type: 'Native', value: 'BNC' }

      vi.mocked(transform).mockReturnValue(transformedCurrencySelection)

      papiApi = new PapiApi(mockPolkadotClient)
      await papiApi.init(mockChain)

      const balance = await papiApi.getBalanceForeignBifrost('some_address', {
        symbol: 'BNC'
      } as TAssetInfo)

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.Tokens.Accounts.getValue).toHaveBeenCalledWith(
        'some_address',
        transformedCurrencySelection
      )
      expect(balance).toBe(6000n)
    })
  })

  describe('getBalanceForeignXTokens', () => {
    it('should return the balance when asset matches symbolOrId', async () => {
      papiApi = new PapiApi(mockPolkadotClient)
      await papiApi.init(mockChain)

      const balance = await papiApi.getBalanceForeignXTokens('Acala', 'some_address', {
        symbol: 'DOT',
        decimals: 10,
        assetId: '1'
      })

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.Tokens.Accounts.getEntries).toHaveBeenCalledWith('some_address')
      expect(balance).toBe(6000n)
    })

    it('getBalanceForeignXTokens (Unique) resolves collection and returns balance when success', async () => {
      papiApi = new PapiApi(mockPolkadotClient)
      await papiApi.init(mockChain)

      const unsafeApi = papiApi.getApi().getUnsafeApi()

      unsafeApi.query.ForeignAssets.ForeignAssetToCollection.getValue = vi
        .fn()
        .mockResolvedValue(123)

      unsafeApi.apis.UniqueApi = {
        balance: vi.fn().mockResolvedValue({ success: true, value: '4242' })
      }

      const asset = {
        symbol: 'uUSDC',
        assetId: '55',
        location: { parents: 1, interior: { X1: { Parachain: 2037 } } }
      } as unknown as TAssetInfo

      const balance = await papiApi.getBalanceForeignXTokens('Unique', 'addr-ss58', asset)

      expect(unsafeApi.query.ForeignAssets.ForeignAssetToCollection.getValue).toHaveBeenCalledWith(
        transform(asset.location)
      )
      expect(unsafeApi.apis.UniqueApi.balance).toHaveBeenCalledWith(
        123,
        { type: 'Substrate', value: 'addr-ss58' },
        '55'
      )
      expect(balance).toBe(4242n)
    })

    it('getBalanceForeignXTokens (Unique) returns 0n when UniqueApi.balance is not successful', async () => {
      papiApi = new PapiApi(mockPolkadotClient)
      await papiApi.init(mockChain)

      const unsafeApi = papiApi.getApi().getUnsafeApi()

      unsafeApi.query.ForeignAssets.ForeignAssetToCollection.getValue = vi
        .fn()
        .mockResolvedValue(999)

      unsafeApi.apis.UniqueApi = {
        balance: vi.fn().mockResolvedValue({ success: false, value: '0' })
      }

      const asset = {
        symbol: 'uUSDT',
        assetId: '77',
        location: { parents: 1, interior: { X1: { Parachain: 2037 } } }
      } as unknown as TAssetInfo

      const balance = await papiApi.getBalanceForeignXTokens('Unique', 'addr-ss58', asset)

      expect(unsafeApi.apis.UniqueApi.balance).toHaveBeenCalled()
      expect(balance).toBe(0n)
    })

    it('getBalanceForeignXTokens (Manta) reads Assets pallet with BigInt(assetId)', async () => {
      papiApi = new PapiApi(mockPolkadotClient)
      await papiApi.init(mockChain)

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.Assets.Account.getValue = vi.fn().mockResolvedValue({
        free: { toString: () => '7777' }
      })

      const bal = await papiApi.getBalanceForeignXTokens('Manta', 'addr', {
        symbol: 'USDC',
        assetId: '100'
      } as TAssetInfo)

      expect(unsafeApi.query.Assets.Account.getValue).toHaveBeenCalledWith(100n, 'addr')
      expect(bal).toBe(7777n)
    })

    it('getBalanceForeignXTokens (Altair) reads OrmlTokens entries and matches by symbol', async () => {
      papiApi = new PapiApi(mockPolkadotClient)
      await papiApi.init(mockChain)

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.OrmlTokens.Accounts.getEntries = vi.fn().mockResolvedValue([
        {
          keyArgs: ['addr', { toString: vi.fn().mockReturnValue('DOT') }],
          value: { free: { toString: vi.fn().mockReturnValue('12345') } }
        }
      ])

      const bal = await papiApi.getBalanceForeignXTokens('Altair', 'addr', {
        symbol: 'DOT',
        assetId: 'ignored-in-this-case'
      } as TAssetInfo)

      expect(unsafeApi.query.OrmlTokens.Accounts.getEntries).toHaveBeenCalledWith('addr')
      expect(bal).toBe(12345n)
    })

    it('should return the balance when asset matches object by id', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.Tokens.Accounts.getEntries = vi.fn().mockResolvedValue([
        {
          keyArgs: [
            '',
            {
              toString: vi.fn().mockReturnValue(''),
              type: 'ForeignToken',
              value: '1'
            }
          ],
          value: {
            free: {
              toString: vi.fn().mockReturnValue('6000')
            }
          }
        }
      ])

      const balance = await papiApi.getBalanceForeignXTokens('Acala', 'some_address', {
        symbol: 'DOT',
        decimals: 10,
        assetId: '1'
      })

      expect(balance).toBe(6000n)
    })

    it('should return the balance when asset matches object by symbol', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.Tokens.Accounts.getEntries = vi.fn().mockResolvedValue([
        {
          keyArgs: [
            '',
            {
              toString: vi.fn().mockReturnValue(''),
              type: 'ForeignToken',
              value: 'DOT'
            }
          ],
          value: {
            free: {
              toString: vi.fn().mockReturnValue('6000')
            }
          }
        }
      ])

      const balance = await papiApi.getBalanceForeignXTokens('Acala', 'some_address', {
        symbol: 'DOT',
        decimals: 10,
        assetId: '1'
      })

      expect(balance).toBe(6000n)
    })

    it('should return null when no matching asset found', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.Tokens.Accounts.getEntries = vi.fn().mockResolvedValue([])

      const balance = await papiApi.getBalanceForeignXTokens('Acala', 'some_address', {
        symbol: 'DOT',
        decimals: 10,
        assetId: '1'
      })

      expect(balance).toEqual(0n)
    })

    it('should return null when no matching asset found - Centrifuge', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.OrmlTokens.Accounts.getEntries = vi.fn().mockResolvedValue([])

      const balance = await papiApi.getBalanceForeignXTokens('Centrifuge', 'some_address', {
        symbol: 'DOT',
        decimals: 10,
        assetId: '1'
      })

      expect(balance).toEqual(0n)
    })
  })

  describe('getBalanceForeignMoonbeam', () => {
    it('should return the balance when balance exists', async () => {
      papiApi = new PapiApi(mockPolkadotClient)
      await papiApi.init(mockChain)

      const balance = await papiApi.getBalanceAssetsPallet('some_address', 1)

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.Assets.Account.getValue).toHaveBeenCalledWith(1, 'some_address')
      expect(balance).toBe(3000n)
    })

    it('should return 0 when balance does not exist', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.Assets.Account.getValue = vi.fn().mockResolvedValue(undefined)

      const balance = await papiApi.getBalanceAssetsPallet('some_address', 1)

      expect(balance).toEqual(0n)
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
      await papiApi.init(mockChain)
      await papiApi.disconnect(true)

      expect(destroySpy).toHaveBeenCalledTimes(1)
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
      papiApi.setDisconnectAllowed(false)
      await papiApi.disconnect(false)

      expect(destroySpy).not.toHaveBeenCalled()
    })
  })

  describe('getXcmPaymentApiFee', () => {
    const chain: TSubstrateChain = 'Moonbeam'
    const localXcm = { type: 'V4', value: [] }
    const baseAsset: TAssetInfo = {
      symbol: 'GLMR',
      location: { parents: 0, interior: { Here: null } } as TLocation
    } as TAssetInfo

    beforeEach(() => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.apis.XcmPaymentApi.query_weight_to_asset_fee = vi
        .fn()
        .mockResolvedValue({ value: 100n })
      unsafeApi.apis.XcmPaymentApi.query_xcm_weight = vi.fn().mockResolvedValue({
        value: { ref_time: 100n, proof_size: 200n }
      })
      unsafeApi.apis.XcmPaymentApi.query_delivery_fees = vi.fn().mockResolvedValue({
        value: { value: [{ fun: { value: 7n } }] }
      })

      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR',
        location: { parents: 0, interior: { Here: null } } as TLocation
      } as TAssetInfo)

      vi.mocked(localizeLocation).mockImplementation((_, loc: TLocation) => loc)

      vi.mocked(isAssetXcEqual)?.mockReturnValue(true)
    })

    it('adds delivery fee directly when asset is native', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
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

      const res = await papiApi.getXcmPaymentApiFee(chain, localXcm, forwardedXcm, baseAsset)

      expect(unsafeApi.apis.XcmPaymentApi.query_weight_to_asset_fee).toHaveBeenCalled()
      expect(unsafeApi.apis.XcmPaymentApi.query_delivery_fees).toHaveBeenCalled()
      // 100 (exec) + 7 (delivery) = 107
      expect(res).toBe(107n)
    })

    it('converts delivery fee via quoteAhPrice when asset is NOT native', async () => {
      const forwardedXcm = [{}, [{}]]
      vi.mocked(isAssetXcEqual).mockReturnValue(false)

      const quoteSpy = vi.spyOn(papiApi, 'quoteAhPrice').mockResolvedValue(5n)

      const res = await papiApi.getXcmPaymentApiFee(chain, localXcm, forwardedXcm, {
        symbol: 'USDC',
        location: { parents: 1, interior: { X1: { Parachain: 1000 } } } as TLocation
      } as TAssetInfo)

      expect(quoteSpy).toHaveBeenCalled()
      // 100 (exec) + 5 (converted delivery)
      expect(res).toBe(105n)
    })

    it('returns only exec fee when forwardedXcm is empty (no delivery fee)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const forwardedXcm: any = []
      const res = await papiApi.getXcmPaymentApiFee(chain, localXcm, forwardedXcm, baseAsset)
      // deliveryFeeResolved = 0n, asset is native => total 100n
      expect(res).toBe(100n)
    })

    it('falls back to 0 delivery fee when quoteAhPrice throws the runtime-entry error', async () => {
      const forwardedXcm = [{}, [{}]]
      vi.mocked(isAssetXcEqual).mockReturnValue(false)

      vi.spyOn(papiApi, 'quoteAhPrice').mockRejectedValue(
        new Error(
          'Runtime entry RuntimeCall(AssetConversionApi.quote_price_exact_tokens_for_tokens) not found'
        )
      )

      const res = await papiApi.getXcmPaymentApiFee(chain, localXcm, forwardedXcm, {
        symbol: 'USDT',
        location: { parents: 1, interior: { X1: { Parachain: 1001 } } } as TLocation
      } as TAssetInfo)

      // exec (100n) + delivery (0n due to error)
      expect(res).toBe(100n)
    })
  })

  describe('getBalanceNativeAcala', () => {
    it('should return the free balance as bigint', async () => {
      papiApi = new PapiApi(mockPolkadotClient)
      await papiApi.init(mockChain)
      const balance = await papiApi.getBalanceNativeAcala('some_address', 'AUSD')

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.Tokens.Accounts.getValue).toHaveBeenCalledOnce()
      expect(balance).toBe(6000n)
    })
  })

  describe('accountToHex', () => {
    it('should return the hex representation of the account - prefixed', () => {
      const account = 'some_account'
      const hexAccount = '0x1234567890abcdef'

      const mockFixedSizeBinary = {
        asHex: vi.fn().mockReturnValue('0x1234567890abcdef')
      }
      const spy = vi
        .spyOn(FixedSizeBinary, 'fromAccountId32')
        .mockReturnValue(mockFixedSizeBinary as unknown as FixedSizeBinary<32>)

      const result = papiApi.accountToHex(account)

      expect(spy).toHaveBeenCalledWith(account)
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

    it('throws InvalidParameterError when the address is invalid', () => {
      const badAddr = 'invalid_address'

      vi.mocked(getSs58AddressInfo).mockReturnValue({
        isValid: false
      })

      expect(() => papiApi.accountToUint8a(badAddr)).toThrow(InvalidParameterError)
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

  describe('getDryRunCall', () => {
    let dryRunApiCallMock: Mock
    const DEFAULT_XCM_VERSION = 3
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
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_call = dryRunApiCallMock

      vi.mocked(computeFeeFromDryRun).mockReturnValue(500n)
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
        currency: 'GLMR',
        asset: { symbol: 'GLMR' } as TAssetInfo,
        weight: { refTime: 10n, proofSize: 20n },
        forwardedXcms: [],
        destParaId: undefined
      })
    })

    it('should retry with version and succeed if first attempt fails with VersionedConversionFailed', async () => {
      const versionedConversionFailedResponse = {
        success: true,
        value: {
          execution_result: {
            success: false,
            value: { error: { value: { type: 'VersionedConversionFailed' } } }
          }
        }
      }
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
        .mockResolvedValueOnce(versionedConversionFailedResponse)
        .mockResolvedValueOnce(successResponseWithVersion)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'DOT'
      } as TAssetInfo)

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        address: testAddress,
        chain: 'AssetHubPolkadot',
        destination: 'Acala',
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
        DEFAULT_XCM_VERSION
      )
      expect(result).toEqual({
        success: true,
        fee: 500n,
        currency: 'DOT',
        asset: { symbol: 'DOT' } as TAssetInfo,
        weight: { refTime: 30n, proofSize: 40n },
        forwardedXcms: [{ type: 'V4', value: { interior: { type: 'Here' } } }],
        destParaId: 0
      })
    })

    it('skips XcmPaymentApi on system chains (falls back to computeFeeFromDryRun)', async () => {
      vi.mocked(hasXcmPaymentApiSupport).mockReturnValue(true)
      vi.mocked(isSystemChain).mockReturnValue(true)

      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'DOT',
        location: { parents: 1, interior: { Here: null } }
      } as unknown as TAssetInfo)

      const unsafeApi = papiApi.getApi().getUnsafeApi()
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
        asset: { symbol: 'DOT' } as WithAmount<TAssetInfo>
      })

      expect(result).toEqual({
        success: true,
        fee: 500n,
        currency: 'DOT',
        asset: expect.objectContaining({ symbol: 'DOT' }),
        weight: { refTime: 10n, proofSize: 20n },
        forwardedXcms: [],
        destParaId: undefined
      })

      expect(xcmPaymentSpy).not.toHaveBeenCalled()
    })

    it('should retry with version and still fail if retry attempt also fails', async () => {
      const versionedConversionFailedResponse = {
        success: true,
        value: {
          execution_result: {
            success: false,
            value: { error: { value: { type: 'VersionedConversionFailed' } } }
          }
        }
      }
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
        .mockResolvedValueOnce(versionedConversionFailedResponse)
        .mockResolvedValueOnce(retryFailedResponse)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        symbol: 'GLMR'
      } as TAssetInfo)

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        address: testAddress,
        chain: 'Kusama',
        destination: 'Acala',
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
        DEFAULT_XCM_VERSION
      )
      expect(result).toEqual({
        success: false,
        failureReason: 'SomeOtherErrorAfterRetry',
        currency: 'GLMR',
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
        currency: 'GLMR',
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
        asset: {
          symbol: 'USDT'
        } as WithAmount<TAssetInfo>
      })
      expect(dryRunApiCallMock).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        success: false,
        failureReason: 'ShortErrorType',
        currency: 'GLMR',
        asset: { symbol: 'GLMR' } as TAssetInfo
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
        asset: {
          symbol: 'USDT'
        } as WithAmount<TAssetInfo>
      })

      expect(dryRunApiCallMock).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        success: false,
        failureReason: 'DispatchError',
        currency: 'GLMR',
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
        currency: 'GLMR',
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
        asset: {
          symbol: 'USDT'
        } as WithAmount<TAssetInfo>
      })
      expect(dryRunApiCallMock).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        success: false,
        failureReason: JSON.stringify(mockApiResponse.value),
        currency: 'GLMR',
        asset: { symbol: 'GLMR' } as TAssetInfo
      })
    })

    it('should throw ChainNotSupportedError for an unsupported chain', async () => {
      await expect(
        papiApi.getDryRunCall({
          tx: mockTransaction,
          address: testAddress,
          chain: 'Acala',
          destination: 'Acala',
          asset: {} as WithAmount<TAssetInfo>
        })
      ).rejects.toThrow(ChainNotSupportedError)
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
  })

  describe('getXcmWeight', () => {
    it('should return the weight for a given XCM payload', async () => {
      const mockXcmPayload = { some: 'xcm-payload' }
      const mockWeight = { ref_time: 100n, proof_size: 200n }
      const unsafeApi = papiApi.getApi().getUnsafeApi()
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

      const unsafeApi = papiApi.getApi().getUnsafeApi()
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
        currency: 'USDT',
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

      const unsafeApi = papiApi.getApi().getUnsafeApi()
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
        currency: 'USDT',
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

      const unsafeApi = papiApi.getApi().getUnsafeApi()
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
        currency: 'USDT',
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
      ).rejects.toThrow(ChainNotSupportedError)
    })

    it('should calculate fee using (amount - originFee - eventAmount) if isFeeAsset and ForeignAssets.Issued event is found', async () => {
      const mockAssetDetails = { symbol: 'USDT', decimals: 6, assetId: 'test-asset-id' }
      const testAmount = 10000n
      const testOriginFee = 100n
      const foreignAssetsIssuedAmount = 500n

      const baseOptions: TDryRunXcmBaseOptions<TPapiTransaction> = {
        originLocation: { parents: 0, interior: { Here: null } } as TLocation,
        xcm: { some: 'xcm-payload' },
        tx: mockTransaction,
        chain: 'AssetHubPolkadot',
        origin: 'AssetHubPolkadot',
        asset: mockAssetDetails,
        feeAsset: mockAssetDetails,
        amount: testAmount,
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

      const unsafeApi = papiApi.getApi().getUnsafeApi()
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

      const unsafeApi = papiApi.getApi().getUnsafeApi()
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
        currency: 'AUSD',
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

      const unsafeApi = papiApi.getApi().getUnsafeApi()
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
        currency: 'AUSD',
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

      const unsafeApi = papiApi.getApi().getUnsafeApi()
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
        currency: 'AUSD',
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

      const unsafeApi = papiApi.getApi().getUnsafeApi()
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
        currency: 'USDT',
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

      const unsafeApi = papiApi.getApi().getUnsafeApi()
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
        currency: 'DOT',
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
      ).rejects.toThrow(ChainNotSupportedError)
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

      const unsafeApi = papiApi.getApi().getUnsafeApi()
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
        currency: 'USDT',
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

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_xcm = vi.fn().mockResolvedValue(mockApiResponse)
      unsafeApi.apis.XcmPaymentApi.query_xcm_weight = vi.fn().mockResolvedValue({
        success: true,
        value: weight
      })

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
        currency: 'AUSD',
        asset: { symbol: 'AUSD', location: { parents: 0, interior: { Here: null } } } as TAssetInfo,
        weight: { refTime: 11n, proofSize: 22n },
        forwardedXcms: []
      })
    })

    it('should fail to get fee from XcmPaymentApi if chain is Moonbeam and asset has no ML', () => {
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

      vi.mocked(hasXcmPaymentApiSupport).mockReturnValue(true)

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_xcm = vi.fn().mockResolvedValue(mockApiResponse)

      return expect(
        papiApi.getDryRunXcm({
          originLocation,
          xcm: dummyXcm,
          tx: mockTransaction,
          chain: 'Moonbeam',
          origin: 'Acala',
          asset: { symbol: 'AUSD' }
        } as TDryRunXcmBaseOptions<TPapiTransaction>)
      ).rejects.toThrow(InvalidCurrencyError)
    })
  })

  describe('objectToHex', () => {
    it('should return the hex representation of the object', async () => {
      const object = { key1: 'value1', key2: 'value2' }

      const result = await papiApi.objectToHex(object)

      expect(result).toBe('0xabcdef')
    })
  })

  describe('hexToUint8a', () => {
    it('should return the Uint8Array representation of the hex', () => {
      const hex = '0x1234567890abcdef'
      const uint8a = new Uint8Array([18, 52, 86, 120, 144, 171, 205, 239])

      const mockBinary = {
        asBytes: vi.fn().mockReturnValue(uint8a)
      }
      const spy = vi
        .spyOn(Binary, 'fromHex')
        .mockReturnValue(mockBinary as unknown as FixedSizeBinary<32>)

      const result = papiApi.hexToUint8a(hex)

      expect(result).toEqual(uint8a)

      expect(spy).toHaveBeenCalledWith(hex)
    })
  })

  describe('stringToUint8a', () => {
    it('should return the Uint8Array representation of the string', () => {
      const string = 'some_string'
      const uint8a = new Uint8Array([115, 111, 109, 101, 95, 115, 116, 114, 105, 110, 103])

      const mockBinary = {
        asBytes: vi.fn().mockReturnValue(uint8a)
      }
      const spy = vi
        .spyOn(Binary, 'fromText')
        .mockReturnValue(mockBinary as unknown as FixedSizeBinary<32>)

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

  describe('quoteAhPrices', () => {
    it('should return the quote for the provided asset', async () => {
      const mlFrom = {
        parents: 1,
        interior: {
          X1: {
            Parachain: 1000
          }
        }
      }
      const mlTo = {
        parents: 1,
        interior: {
          X1: {
            Parachain: 1001
          }
        }
      }

      const amountIn = 1000n
      const quote = await papiApi.quoteAhPrice(mlFrom, mlTo, amountIn)

      expect(quote).toBe(1n)
    })

    it('should return undefined when quote is not available', async () => {
      const mlFrom = {
        parents: 1,
        interior: {
          X1: {
            Parachain: 1000
          }
        }
      }
      const mlTo = {
        parents: 1,
        interior: {
          X1: {
            Parachain: 1001
          }
        }
      }

      const amountIn = 1000n
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.apis.AssetConversionApi.quote_price_exact_tokens_for_tokens = vi
        .fn()
        .mockResolvedValue(undefined)

      const quote = await papiApi.quoteAhPrice(mlFrom, mlTo, amountIn)

      expect(quote).toBeUndefined()
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
      vi.mocked(createClient).mockReset()
    })

    it('re-uses the same PolkadotClient and destroys it after refs drop to 0 when destroyWanted=true', async () => {
      vi.useFakeTimers()

      const ws = 'ws://cache-test:9944'
      const sharedClient = {
        destroy: vi.fn(),
        getUnsafeApi: vi.fn().mockReturnValue({}),
        getChainSpecData: vi.fn().mockResolvedValue(undefined)
      } as unknown as PolkadotClient

      vi.mocked(createClient).mockReturnValue(sharedClient)

      const apiA = new PapiApi(ws)
      await apiA.init('Acala', 1_000) // ttl = 1 s

      const apiB = new PapiApi(ws)
      await apiB.init('Acala', 1_000)

      expect(createClient).toHaveBeenCalledTimes(1)

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
      } as unknown as PolkadotClient
      vi.mocked(createClient).mockReturnValue(idleClient)

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
})
